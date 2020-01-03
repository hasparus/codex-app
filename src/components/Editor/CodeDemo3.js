// import ReactDOM from "react-dom"
import detect from "./detect"
import React from "react"
import stylex from "stylex"
import useMethods from "use-methods"
import utf8 from "./utf8"

import "./code-demo.css"

/*
 *
 */

// `isBreakOrTextNode` returns whether a node is a break
// node or a text node.
function isBreakOrTextNode(node) {
	const ok = (
		(node.nodeType === Node.ELEMENT_NODE && node.nodeName === "BR") ||
		node.nodeType === Node.TEXT_NODE
	)
	return ok
}

// `isBlockDOMNode` returns whether a node is a block DOM
// node.
function isBlockDOMNode(node) {
	const ok = (
		node.nodeType === Node.ELEMENT_NODE &&
		node.hasAttribute("data-vdom-node")
	)
	return ok
}

// `nodeValue` mocks the browser function.
export function nodeValue(node) {
	if (!isBreakOrTextNode(node)) {
		return ""
	}
	// (1) Guard break node:
	// (2) Convert non-breaking spaces:
	return (node.nodeValue || "" /* 1 */).replace("\u00a0", " ") // 2
}

// `innerText` mocks the browser function.
function innerText(rootNode) {
	let value = ""
	const compute = startNode => {
		for (const currentNode of startNode.childNodes) {
			if (isBreakOrTextNode(currentNode)) {
				value += nodeValue(currentNode)
			} else {
				compute(currentNode)
				if (isBlockDOMNode(currentNode) &&
						currentNode.nextSibling) {
					value += "\n"
				}
			}
		}
	}
	compute(rootNode)
	return value
}

// `computeVDOMCursor` computes the VDOM cursor from a DOM
// cursor.
function computeVDOMCursor(rootNode, node, offset) {
	let pos = 0
	while (node.childNodes.length) {
		node = node.childNodes[0]
	}
	const compute = startNode => {
		for (const currentNode of startNode.childNodes) {
			if (isBreakOrTextNode(currentNode)) {
				if (currentNode === node) {
					return true
				}
				pos += nodeValue(currentNode).length
			} else {
				if (compute(currentNode)) {
					return true
				} else if (isBlockDOMNode(currentNode) &&
						currentNode.nextSibling) {
					pos += 1
				}
			}
		}
		return false
	}
	compute(rootNode)
	return pos + offset
}

// `computeDOMCursor` computes the DOM cursor from a VDOM
// cursor.
function computeDOMCursor(rootNode, pos) {
	const node = {
		node: rootNode,
		offset: 0,
	}
	const compute = startNode => {
		for (const currentNode of startNode.childNodes) {
			if (isBreakOrTextNode(currentNode)) {
				const { length } = nodeValue(currentNode)
				if (pos - length <= 0) {
					Object.assign(node, {
						node: currentNode,
						offset: pos,
					})
					return true
				}
				pos -= length
			} else {
				if (compute(currentNode)) {
					return true
				} else if (isBlockDOMNode(currentNode) &&
						currentNode.nextSibling) {
					pos -= 1
				}
			}
		}
		return false
	}
	compute(rootNode)
	return node
}

/*
 *
 */

class Lexer {
	constructor(value) {
		Object.assign(this, {
			value,       // The plain text value.
			x1:    0,    // The selection start.
			x2:    0,    // The selection end.
			width: 0,    // The width of the current character.
			lines: [[]], // The parsed multiline output.
		})
	}
	next() {
		if (this.x2 === this.value.length) {
			this.width = 0
			return undefined // EOF
		}
		const ch = this.value[this.x2]
		this.width = 1
		this.x2 += this.width
		return ch
	}
	peek() {
		const ch = this.next()
		this.backup()
		return ch
	}
	backup() {
		this.x2 -= this.width
	}
	emit(token) {
		const nth = this.lines.length - 1
		this.lines[nth].push({
			token,
			value: this.focus(),
		})
		this.ignore()
	}
	emit_line(token) {
		this.backup()
		this.emit(token)
		this.lines.push([])
		this.next()
		this.ignore()
	}
	focus() {
		return this.value.slice(this.x1, this.x2)
	}
	ignore() {
		this.x1 = this.x2
	}
	accept(str) {
		const next = this.next()
		const ok = str.includes(next)
		if (!ok) {
			this.backup()
		}
		return ok
	}
	accept_run(str) {
		while (this.accept(str)) {
			// No-op.
		}
	}
}

const Token = {
	UNS: "uns", // Unset (whitespace does not use a token).
	COM: "com", // Comment.
	KEY: "key", // Keyword.
	NUM: "num", // Number.
	STR: "str", // String.
	PUN: "pun", // Punctuation.
	FUN: "fun", // Function.
}

const keywords = {
	break:       true,
	default:     true,
	func:        true,
	interface:   true,
	select:      true,
	case:        true,
	defer:       true,
	go:          true,
	map:         true,
	struct:      true,
	chan:        true,
	else:        true,
	goto:        true,
	package:     true,
	switch:      true,
	const:       true,
	fallthrough: true,
	if:          true,
	range:       true,
	type:        true,
	continue:    true,
	for:         true,
	import:      true,
	return:      true,
	var:         true,
	bool:        true,
	byte:        true,
	complex64:   true,
	complex128:  true,
	error:       true,
	float32:     true,
	float64:     true,
	int:         true,
	int8:        true,
	int16:       true,
	int32:       true,
	int64:       true,
	rune:        true,
	string:      true,
	uint:        true,
	uint8:       true,
	uint16:      true,
	uint32:      true,
	uint64:      true,
	uintptr:     true,
	true:        true,
	false:       true,
	iota:        true,
	nil:         true,
	append:      true,
	cap:         true,
	close:       true,
	complex:     true,
	copy:        true,
	delete:      true,
	imag:        true,
	len:         true,
	make:        true,
	new:         true,
	panic:       true,
	print:       true,
	println:     true,
	real:        true,
	recover:     true,
}

// if (!this.value.length) {
// 	this.renderDOMComponents("\n")
// 	return
// }

// https://youtube.com/watch?v=HxaD_trXwRE
function parse(value) {
	const lexer = new Lexer(value)
	let ch = ""
	while ((ch = lexer.next())) {
		let token = 0
		switch (true) {
		// Comment:
		case ch === "/" && (lexer.peek() === "/" || lexer.peek() === "*"):
			ch = lexer.next()
			if (ch === "/") {
				while ((ch = lexer.next())) {
					if (ch === "\n") {
						lexer.backup()
						break
					}
				}
			} else if (ch === "*") {
				while ((ch = lexer.next())) {
					if (ch === "*" && lexer.peek() === "/") {
						lexer.next()
						break
					} else if (ch === "\n") {
						lexer.emit_line(Token.COM)
						// Don't break.
					}
				}
			}
			token = Token.COM
			break
			// Whitespace:
		case ch === " " || ch === "\t" || ch === "\n":
			if (/* lexer.x2 > 1 && */ ch === "\n") { // FIXME?
				lexer.lines.push([])
				lexer.ignore()
				break
			}
			lexer.accept_run(" \t")
			break
			// Keyword or function:
		case (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_":
			lexer.accept_run("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789")
			if (keywords[lexer.focus()]) {
				token = Token.KEY
				break
			}
			const { x2 } = lexer
			lexer.accept_run(" ")
			if (lexer.peek() === "(") {
				token = Token.FUN
			}
			lexer.x2 = x2
			token = token || Token.UNS
			break
			// String:
		case ch === "'" || ch === "\"" || ch === "`":
			const quote = ch
			while ((ch = lexer.next())) {
				if (quote !== "`" && ch === "\\" && lexer.peek() === quote) {
					lexer.next()
				} else if (quote === "`" && ch === "\n") {
					lexer.emit_line(Token.STR)
					// don't break
				} else if (ch === quote || ch === "\n") { // break opportunities
					if (ch === "\n") {
						lexer.backup()
					}
					break
				}
			}
			token = Token.STR
			break
 			// Number:
		case ch >= "0" && ch <= "9":
			let base = "0123456789"
			if (lexer.accept("0") && lexer.accept("xX")) {
				base += "abcdefABCDEF"
			}
			lexer.accept_run(base)
			lexer.accept(".") && lexer.accept_run(base)
			lexer.accept("eE") && lexer.accept("-+") && lexer.accept_run("0123456789")
			lexer.accept("i")
			token = Token.NUM
			break
			// Punctuation:
		case "!%&()*+,-./:;<=>[]^{|}".includes(ch):
			lexer.accept_run("!%&()*+,-./:;<=>[]^{|}")
			token = Token.PUN
			break
			// Non-whitespace:
		default:
			while ((ch = lexer.next())) {
				if (ch === " " || ch === "\t" || ch === "\n") {
					lexer.backup()
					break
				}
			}
			token = Token.UNS
			break
		}
		if (lexer.x1 < lexer.x2) {
			lexer.emit(token)
		}
	}
	return lexer.lines
}

/*
 *
 */

// Compound component.
const Code = props => (
	<div contentEditable suppressContentEditableWarning>

		<pre style={stylex.parse("overflow -x:scroll")} spellCheck={false} data-vdom-node>
			{!props.children.length && (
				props.children
			)}

			{props.children.length > 0 && (
				props.children.map((line, index) => (
					<code key={index} style={stylex.parse("block")} data-vdom-node>
						{!line.length && (
							<br />
						)}

						{line.map((item, index) => (
							!item.token ? (
								item.value
							) : (
								<span key={index} className={item.token}>
									{item.value}
								</span>
							)
						))}
					</code>
				)))}
		</pre>

	</div>
)

/*
 *
 */

const initialState = {
	initialValue: "",
	value: "",
	isFocused: false,
	pos1: 0,
	pos2: 0,

	shouldRenderComponents: 0,
	shouldRenderCursor: 0,

	components: [],

	// reactDOM: document.createElement("div"),
}

const reducer = state => ({
	focus() {
		state.isFocused = true
	},
	blur() {
		state.isFocused = false
	},
	setState(value, pos1, pos2) {
		if (pos1 > pos2) {
			[pos1, pos2] = [pos2, pos1]
		}
		Object.assign(state, { value, pos1, pos2 })
	},
	write(shouldRender, value, pos1, pos2) {
		Object.assign(state, {
			value,
			pos1,
			pos2,
		})

		// state.value = value
		// state.pos1 = pos1
		// state.pos2 = pos2
		state.shouldRenderComponents += shouldRender
	},
	render() {
		state.components = <Code>{parse(state.value)}</Code>
		state.shouldRenderCursor++
	}
})

const init = initialValue => initialState => {
	const state = {
		...initialState,
		initialValue,
		value: initialValue,
	}
	return state
}

function useEditor(initialValue) {
	return useMethods(reducer, initialState, init(initialValue))
}

/*
 *
 */

const DebugEditor = props => (
	<pre style={stylex.parse("overflow -x:scroll")}>
		<p style={{ MozTabSize: 2, tabSize: 2, font: "12px/1.375 Monaco" }}>
			{JSON.stringify(
				{
					...props.state,
					components: undefined,
				},
				null,
				"\t",
			)}
		</p>
	</pre>
)

function Editor(props) {
	const ref = React.useRef()
	const ref2 = React.useRef()


	const [state, dispatch] = useEditor(`package main

import "fmt"

func main() {
	fmt.Println("hello, world!")
}`)

	const [initialRender, setInitialRender] = React.useState()

	React.useEffect(
		React.useCallback(() => {
			const parsed = parse(state.initialValue)
			setInitialRender(<Code>{parsed}</Code>)
		}, [state]),
		[],
	)

	// Should render components:
	React.useLayoutEffect(
		React.useCallback(() => {
			if (!state.isFocused) {
				// No-op.
				return
			}
			dispatch.render()
		}, [state, dispatch]),
		[state.shouldRenderComponents],
	)

	React.useLayoutEffect(
		React.useCallback(() => {
			if (!state.isFocused) {
				// No-op.
				return
			}
			ref.current.childNodes[0].replaceWith(ref2.current.childNodes[0].cloneNode(true))
		}, [state]),
		[state.components],
	)

	// Should render cursor:
	React.useLayoutEffect(
		React.useCallback(() => {
			if (!state.isFocused) {
				// No-op.
				return
			}
			const selection = document.getSelection()
			const range = document.createRange()
			const { node: _node, offset } = computeDOMCursor(ref.current, state.pos1)
			range.setStart(_node, offset)
			range.collapse()
			selection.removeAllRanges()
			selection.addRange(range)
		}, [state]),
		[state.shouldRenderCursor],
	)

	React.useLayoutEffect(() => {
		const onSelectionChange = e => {
			if (!state.isFocused) {
				// No-op.
				return
			}
			const { anchorNode, anchorOffset, focusNode, focusOffset } = document.getSelection()
			const pos1 = computeVDOMCursor(ref.current, anchorNode, anchorOffset)
			let pos2 = pos1
			if (focusNode !== anchorNode || focusOffset !== anchorOffset) {
				pos2 = computeVDOMCursor(ref.current, focusNode, focusOffset)
			}
			dispatch.setState(state.value, pos1, pos2)
		}
		document.addEventListener("selectionchange", onSelectionChange)
		return () => {
			document.removeEventListener("selectionchange", onSelectionChange)
		}
	}, [state, dispatch])

	// GPU optimization:
	const translateZ = {}
	if (state.isFocused) {
		Object.assign(translateZ, {
			transform: "translateZ(0px)",
		})
	}

	return (
		<div>
			{React.createElement(
				"article",
				{
					ref,

					style: translateZ,

					contentEditable: true,
					suppressContentEditableWarning: true,
					spellCheck: false,

					onFocus: dispatch.focus,
					onBlur:  dispatch.blur,

					onKeyDown: e => {
						if (e.key === "Tab") {
							e.preventDefault()
							// TODO
							return
						} else if (e.shiftKey && e.key === "Enter") { // Add new detector?
							e.preventDefault()
							// TODO
							return
						} else if (detect.isUndo(e)) {
							e.preventDefault()
							return
						} else if (detect.isRedo(e)) {
							e.preventDefault()
							return
						}
					},

					onInput: e => {
						const value = innerText(ref.current)

						const {
							anchorNode,   // The cursor start node.
							anchorOffset, // The cursor start node offset.
							focusNode,    // The cursor end node.
							focusOffset,  // The cursor end node offset.
						} = document.getSelection()

						const pos1 = computeVDOMCursor(ref.current, anchorNode, anchorOffset)
						const pos2 = computeVDOMCursor(ref.current, focusNode, focusOffset)

						const shouldRender = (
							(!e.nativeEvent.data || !utf8.isAlphanum(e.nativeEvent.data)) &&
							e.nativeEvent.inputType !== "insertCompositionText"
						)

						// console.log(shouldRender)
						dispatch.write(shouldRender, value, pos1, pos2)

						// // const shouldRender = (
						// // 	(!e.nativeEvent.data || !utf8.isAlphanum(e.nativeEvent.data)) &&
						// // 	e.nativeEvent.inputType !== "insertCompositionText"
						// // )
						// //
						// // if (!shouldRender) {
						// // 	// No-op.
						// // 	return
						// // }
						//
						// const parsed = parse(value)
						// // ReactDOM.render(<Code>{parsed}</Code>, state.reactDOM)
						// ref.current.childNodes[0].remove()
						// ref.current.appendChild(state.reactDOM.childNodes[0].cloneNode(true))
						//
						// // const parsed = parse(value)
						// // ReactDOM.render(<Code>{parsed}</Code>, state.reactDOM)
						// // console.log(state.reactDOM)
						//
						// // ref.current.childNodes[0].remove()
						// // ref.current.appendChild(state.reactDOM.cloneNode(true))
					},

					// onCut: e => {
					// 	e.preventDefault()
					// 	if (state.pos1 === state.pos2) {
					// 		// No-op.
					// 		return
					// 	}
					// 	const cutValue = state.value.slice(state.pos1, state.pos2)
					// 	e.clipboardData.setData("text/plain", cutValue)
					// 	// FIXME
					// },
					//
					// onCopy: e => {
					// 	e.preventDefault()
					// 	if (state.pos1 === state.pos2) {
					// 		// No-op.
					// 		return
					// 	}
					// 	const copyValue = state.value.slice(state.pos1, state.pos2)
					// 	e.clipboardData.setData("text/plain", copyValue)
					// },
					//
					// onPaste: e => {
					// 	e.preventDefault()
					// 	const pasteValue = e.clipboardData.getData("text/plain")
					// 	if (!pasteValue) {
					// 		// No-op.
					// 		return
					// 	}
					// 	// FIXME
					// },
					//
					// onDragStart: e => e.preventDefault(),
					// onDrop:      e => e.preventDefault(),
				},
				initialRender,
			)}
			<div ref={ref2} style={{ display: "none" }}>
				{state.components}
			</div>
			{/* <div style={stylex.parse("h:28")} /> */}
			{/* <DebugEditor state={state} /> */}
		</div>
	)
}

export default Editor