// import Debugger from "./Debugger"
import Context from "./Context"
import getCoordsFromRange from "./helpers/getCoordsFromRange"
import getPosFromRange from "./helpers/getPosFromRange"
import getRangeFromPos from "./helpers/getRangeFromPos"
import innerText from "./helpers/innerText"
import platform from "utils/platform"
import React from "react"
import ReactDOM from "react-dom"
import Stylesheets from "./Stylesheets"
import syncTrees from "./helpers/syncTrees"

const style = {
	whiteSpace: "pre-wrap",
	outline: "none",
	overflowWrap: "break-word",
}

function Editor({ state, dispatch, ...props }) {
	const ref = React.useRef()
	const isPointerDownRef = React.useRef()
	const dedupeCompositionEndRef = React.useRef()

	const [forceRender, setForceRender] = React.useState(false)

	React.useLayoutEffect(
		React.useCallback(() => {
			ReactDOM.render(state.components, state.reactDOM, () => {
				// Sync the DOMs:
				const mutations = syncTrees(ref.current, state.reactDOM)
				if ((!state.shouldRender || !mutations) && !forceRender) {
					// No-op
					return
				}
				// Reset the cursor:
				setForceRender(false) // Reset
				const selection = document.getSelection()
				if (selection.rangeCount) {
					selection.removeAllRanges()
				}
				try {
					const range = document.createRange()
					const { node, offset } = getRangeFromPos(ref.current, state.pos1)
					range.setStart(node, offset)
					range.collapse()
					// NOTE: Use pos1 and pos2
					if (state.pos1 !== state.pos2) {
						// TODO: Use state.pos1 as a shortcut
						const { node, offset } = getRangeFromPos(ref.current, state.pos2)
						range.setEnd(node, offset)
					}
					selection.addRange(range)
				} catch (e) {
					console.warn({ "shouldRender/catch": e })
				}
			})
		}, [state, forceRender]),
		[state.shouldRender],
	)

	// TODO: Idle timeout
	React.useEffect(
		React.useCallback(() => {
			if (!state.focused) {
				// No-op
				return
			}
			const id = setInterval(() => {
				dispatch.storeUndo()
			}, 1e3)
			return () => {
				setTimeout(() => {
					clearInterval(id)
				}, 1e3)
			}
		}, [state, dispatch]),
		[state.focused],
	)

	// Shortcuts:
	React.useEffect(
		React.useCallback(() => {
			const onKeyDown = e => {
				switch (true) {
				// Prefers text stylesheet mode:
				case platform.detectKeyCode(e, 49, { shiftKey: true }): // 49: 1
					e.preventDefault()
					dispatch.preferTextStylesheet()
					return
				// Prefers code stylesheet mode:
				case platform.detectKeyCode(e, 50, { shiftKey: true }): // 50: 2
					e.preventDefault()
					dispatch.preferCodeStylesheet()
					return
				// Prefers text background:
				case platform.detectKeyCode(e, 220): // 220: \
					e.preventDefault()
					dispatch.preferTextBackground()
					return
				// Prefers read-only mode:
				case platform.detectKeyCode(e, 191): // 191: /
					e.preventDefault()
					dispatch.toggleReadOnlyMode()
					return
				default:
					// No-op
					break
				}
			}
			document.addEventListener("keydown", onKeyDown)
			return () => {
				document.removeEventListener("keydown", onKeyDown)
			}
		}, [dispatch]),
		[],
	)

	// Gets the cursors (and coords).
	const getPos = ({ andCoords } = { andCoords: true }) => {
		const selection = document.getSelection()
		const range = selection.getRangeAt(0)
		const pos1 = getPosFromRange(ref.current, range.startContainer, range.startOffset)
		let pos2 = pos1
		if (!range.collapsed) {
			// TODO: Use state.pos1 as a shortcut
			pos2 = getPosFromRange(ref.current, range.endContainer, range.endOffset)
		}
		let coords = null
		if (andCoords) {
			coords = getCoordsFromRange(range)
		}
		return [pos1, pos2, coords]
	}

	const { Provider } = Context
	return (
		<Provider value={[state, dispatch]}>
			{React.createElement(
				"article",
				{
					ref,

					className: ["editor", state.prefersClassName].join(" "),

					style,

					contentEditable: !state.prefersReadOnlyMode && true,
					suppressContentEditableWarning: !state.prefersReadOnlyMode && true,

					onFocus: dispatch.actionFocus,
					onBlur:  dispatch.actionBlur,

					onSelect: e => {
						try {
							const selection = document.getSelection()
							const range = selection.getRangeAt(0)
							// Guard the root node:
							if (range.startContainer === ref.current || range.endContainer === ref.current) {
								// Iterate to the innermost start node:
								let startNode = ref.current.childNodes[0]
								while (startNode.childNodes.length) {
									startNode = startNode.childNodes[0]
								}
								// Iterate to the innermost end node:
								let endNode = ref.current.childNodes[ref.current.childNodes.length - 1]
								while (endNode.childNodes.length) {
									endNode = endNode.childNodes[endNode.childNodes.length - 1]
								}
								// Reset the range:
								const range = document.createRange()
								range.setStart(startNode, 0)
								range.setEnd(endNode, (endNode.nodeValue || "").length)
								selection.removeAllRanges()
								selection.addRange(range)
							}
							const [pos1, pos2, coords] = getPos()
							dispatch.actionSelect(pos1, pos2, coords)
						} catch (e) {
							console.warn({ "onSelect/catch": e })
						}
					},
					onPointerDown: e => {
						isPointerDownRef.current = true
					},
					onPointerMove: e => {
						if (!state.focused) {
							isPointerDownRef.current = false // Reset
							return
						} else if (!isPointerDownRef.current) {
							// No-op
							return
						}
						try {
							const [pos1, pos2, coords] = getPos()
							dispatch.actionSelect(pos1, pos2, coords)
						} catch (e) {
							console.warn({ "onPointerMove/catch": e })
						}
					},
					onPointerUp: e => {
						isPointerDownRef.current = false
					},

					onKeyDown: e => {
						switch (true) {
						// Tab:
						case e.keyCode === 9: // Tab
							e.preventDefault()
							dispatch.tab()
							return
						// Enter:
						case e.keyCode === 13: // Enter
							e.preventDefault()
							dispatch.enter()
							return
						// Undo:
						case platform.detectUndo(e):
							e.preventDefault()
							dispatch.undo()
							return
						// Redo:
						case platform.detectRedo(e):
							e.preventDefault()
							dispatch.redo()
							return
						default:
							// No-op
							break
						}
					},
					onCompositionEnd: e => {
						// https://github.com/w3c/uievents/issues/202#issue-316461024
						dedupeCompositionEndRef.current = true
						// Input:
						const data = innerText(ref.current)
						const [pos1, pos2] = getPos({ andCoords: false })
						dispatch.actionInput(data, pos1, pos2)
					},
					onInput: e => {
						if (dedupeCompositionEndRef.current) {
							dedupeCompositionEndRef.current = false // Reset
							return
						}
						if (e.nativeEvent.isComposing) {
							// No-op
							return
						}
						// https://w3.org/TR/input-events-2/#interface-InputEvent-Attributes
						// console.log(e.nativeEvent.inputType) // DELETEME
						switch (e.nativeEvent.inputType) {
						case "insertLineBreak":
						case "insertParagraph":
							dispatch.enter()
							return
						case "deleteContentBackward":
							dispatch.backspaceChar()
							return
						case "deleteWordBackward":
							dispatch.backspaceWord()
							return
						case "deleteSoftLineBackward":
						case "deleteHardLineBackward":
							dispatch.backspaceLine()
							return
						case "deleteContentForward":
							dispatch.backspaceCharForwards()
							return
						case "deleteWordForward":
							dispatch.backspaceWordForwards()
							return
						case "historyUndo":
							dispatch.undo()
							return
						case "historyRedo":
							dispatch.redo()
							return
						default:
							// No-op
							break
						}
						// Input:
						const data = innerText(ref.current)
						const [pos1, pos2] = getPos({ andCoords: false })
						dispatch.actionInput(data, pos1, pos2)
					},

					onCut: e => {
						if (state.prefersReadOnlyMode) {
							// No-op
							return
						}
						e.preventDefault()
						if (state.collapsed) {
							// No-op
							return
						}
						const substr = state.data.slice(state.pos1, state.pos2)
						e.clipboardData.setData("text/plain", substr)
						dispatch.cut()
					},
					onCopy: e => {
						if (state.prefersReadOnlyMode) {
							// No-op
							return
						}
						e.preventDefault()
						if (state.collapsed) {
							// No-op
							return
						}
						const substr = state.data.slice(state.pos1, state.pos2)
						e.clipboardData.setData("text/plain", substr)
						dispatch.copy()
					},
					onPaste: e => {
						if (state.prefersReadOnlyMode) {
							// No-op
							return
						}
						e.preventDefault()
						const substr = e.clipboardData.getData("text/plain")
						if (!substr) {
							// No-op
							return
						}
						setForceRender(true) // *Use the Force, Luke*
						dispatch.paste(substr)
					},

					onDrag: e => e.preventDefault(),
					onDrop: e => e.preventDefault(),
				},
			)}
			<Stylesheets />
			{/* <Debugger /> */}
		</Provider>
	)
}

export default Editor
