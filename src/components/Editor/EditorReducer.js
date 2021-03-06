import * as Preferences from "./PreferencesReducer"
import emoji from "emoji-trie"
import EnumActionTypes from "./EnumActionTypes"
import newNodes from "./helpers/newNodes"
import newPos from "./helpers/newPos"
import parse from "./parser"
import useMethods from "use-methods"

import {
	atEnd,
	atStart,
	isAlphanum,
	isHWhiteSpace,
	isVWhiteSpace,
	isWhiteSpace,
} from "utils/encoding/utf8"

// history: ...History.initialState,
const initialState = {
	prefs: {
		...Preferences.initialState,
	},
	actionType: "",      // The type of the current action
	actionTimeStamp: 0,  // The time stamp of the current action
	isFocused: false,    // Is the editor focused?
	hasSelection: false, // Does the editor have a selection?
	data: "",            // The plain text data
	body: null,          // The parsed nodes
	pos1: newPos(),      // The start cursor
	pos2: newPos(),      // The end cursor
	components: null,    // The React components
	shouldRender: 0,     // Should rerender React components?
	didRender: 0,        // Did rerender React components?
	reactDOM: null,      // The React DOM (not what the user sees)
	history: {           //
		stack: [],         // The history state stack
		index: 0,          // The history state stack index
	},                   //
	resetPos: false,     // Did reset the cursors?
}

const reducer = state => ({
	...Preferences.reducer(state),
	newAction(actionType) {
		const actionTimeStamp = Date.now()
		if (actionType === EnumActionTypes.SELECT && actionTimeStamp - state.actionTimeStamp < 200) {
			// No-op
			return
		}
		Object.assign(state, { actionType, actionTimeStamp })
	},
	actionFocus() {
		this.newAction(EnumActionTypes.FOCUS)
		state.isFocused = true
	},
	actionBlur() {
		this.newAction(EnumActionTypes.BLUR)
		state.isFocused = false // Reset
	},
	actionSelect(pos1, pos2) {
		this.newAction(EnumActionTypes.SELECT)
		const hasSelection = pos1.pos !== pos2.pos
		Object.assign(state, { hasSelection, pos1, pos2 })
	},
	actionInput(nodes, atEnd, pos1, pos2) {
		// Create a new action:
		this.newAction(EnumActionTypes.INPUT)
		if (!state.history.index && !state.resetPos) {
			Object.assign(state.history.stack[0], {
				pos1: state.pos1,
				pos2: state.pos2,
			})
			state.resetPos = true
		}
		this.dropRedos()
		// Update body:
		const key1 = nodes[0].key
		const index1 = state.body.findIndex(each => each.key === key1)
		if (index1 === -1) {
			throw new Error("FIXME")
		}
		const key2 = nodes[nodes.length - 1].key
		const index2 = !atEnd ? state.body.findIndex(each => each.key === key2) : state.body.length - 1
		if (index2 === -1) {
			throw new Error("FIXME")
		}
		state.body.splice(index1, (index2 + 1) - index1, ...nodes)
		// Update data, pos1, and pos2:
		const data = state.body.map(each => each.data).join("\n")
		Object.assign(state, { data, pos1, pos2 })
		this.render()
	},
	write(substr, dropL = 0, dropR = 0) {
		// Create a new action:
		this.newAction(EnumActionTypes.INPUT)
		if (!state.history.index && !state.resetPos) {
			Object.assign(state.history.stack[0], {
				pos1: state.pos1,
				pos2: state.pos2,
			})
			state.resetPos = true
		}
		this.dropRedos()
		// Drop bytes (L):
		state.pos1.pos -= dropL
		while (dropL) {
			const bytesToStart = state.pos1.x
			if (dropL <= bytesToStart) {
				state.pos1.x -= dropL
				dropL = 0
				break // XOR
			}
			dropL -= bytesToStart + 1
			state.pos1.y--
			state.pos1.x = state.body[state.pos1.y].data.length
		}
		// Drop bytes (R):
		state.pos2.pos += dropR
		while (dropR) {
			const bytesToEnd = state.body[state.pos2.y].data.length - state.pos2.x
			if (dropR <= bytesToEnd) {
				state.pos2.x += dropR
				dropR = 0
				break // XOR
			}
			dropR -= bytesToEnd + 1
			state.pos2.y++
			state.pos2.x = 0 // Reset
		}
		// Parse the new nodes:
		const nodes = newNodes(substr)
		const startNode = state.body[state.pos1.y]
		const endNode = { ...state.body[state.pos2.y] } // Create a new reference
		// Start node:
		startNode.data = startNode.data.slice(0, state.pos1.x) + nodes[0].data
		state.body.splice(state.pos1.y + 1, state.pos2.y - state.pos1.y, ...nodes.slice(1))
		// End node:
		let node = startNode
		if (nodes.length > 1) {
			node = nodes[nodes.length - 1]
		}
		node.data += endNode.data.slice(state.pos2.x)
		// Update data, pos1, and pos2:
		const data = state.body.map(each => each.data).join("\n")
		const pos1 = { ...state.pos1, pos: state.pos1.pos + substr.length }
		const pos2 = { ...pos1 }
		Object.assign(state, { data, pos1, pos2 })
		this.render()
	},
	backspaceChar() {
		let dropL = 0
		if (!state.hasSelection && state.pos1.pos) { // Inverse
			const substr = state.data.slice(0, state.pos1.pos)
			const rune = emoji.atEnd(substr) || atEnd(substr)
			dropL = rune.length
		}
		this.write("", dropL, 0)
	},
	backspaceWord() {
		if (state.hasSelection) {
			this.write("")
			return
		}
		// Iterate to a non-h. white space:
		let index = state.pos1.pos
		while (index) {
			const substr = state.data.slice(0, index)
			const rune = emoji.atEnd(substr) || atEnd(substr)
			if (!rune || !isHWhiteSpace(rune)) {
				// No-op
				break
			}
			index -= rune.length
		}
		// Get the next rune:
		const substr = state.data.slice(0, index)
		const rune = emoji.atEnd(substr) || atEnd(substr)
		// Iterate to an alphanumeric rune OR a non-alphanumeric
		// rune based on the next rune:
		if (rune && !isAlphanum(rune)) {
			// Iterate to an alphanumeric rune:
			while (index) {
				const substr = state.data.slice(0, index)
				const rune = emoji.atEnd(substr) || atEnd(substr)
				if (!rune || isAlphanum(rune) || isWhiteSpace(rune)) {
					// No-op
					break
				}
				index -= rune.length
			}
		} else if (rune && isAlphanum(rune)) {
			// Iterate to a non-alphanumeric rune:
			while (index) {
				const substr = state.data.slice(0, index)
				const rune = emoji.atEnd(substr) || atEnd(substr)
				if (!rune || !isAlphanum(rune) || isWhiteSpace(rune)) {
					// No-op
					break
				}
				index -= rune.length
			}
		}
		// Get the number of bytes to drop:
		let dropL = state.pos1.pos - index
		if (!dropL && index - 1 >= 0 && state.data[index - 1] === "\n") {
			dropL = 1
		}
		this.write("", dropL, 0)
	},
	backspaceLine() {
		if (state.hasSelection) {
			this.write("")
			return
		}
		// Iterate to a v. white space rune:
		let index = state.pos1.pos
		while (index >= 0) {
			const substr = state.data.slice(0, index)
			const rune = emoji.atEnd(substr) || atEnd(substr)
			if (!rune || isVWhiteSpace(rune)) {
				// No-op
				break
			}
			index -= rune.length
		}
		// Get the number of bytes to drop:
		let dropL = state.pos1.pos - index
		if (!dropL && index - 1 >= 0 && state.data[index - 1] === "\n") {
			dropL = 1
		}
		this.write("", dropL, 0)
	},
	backspaceCharForwards() {
		let dropR = 0
		if (!state.hasSelection && state.pos1.pos < state.data.length) { // Inverse
			const substr = state.data.slice(state.pos1.pos)
			const rune = emoji.atStart(substr) || atStart(substr)
			dropR = rune.length
		}
		this.write("", 0, dropR)
	},
	backspaceWordForwards() {
		if (state.hasSelection) {
			this.write("")
			return
		}
		// Iterate to a non-h. white space:
		let index = state.pos1.pos
		while (index < state.data.length) {
			const substr = state.data.slice(index)
			const rune = emoji.atStart(substr) || atStart(substr)
			if (!rune || !isHWhiteSpace(rune)) {
				// No-op
				break
			}
			index += rune.length
		}
		// Get the next rune:
		const substr = state.data.slice(index)
		const rune = emoji.atStart(substr) || atStart(substr)
		// Iterate to an alphanumeric rune OR a non-alphanumeric
		// rune based on the next rune:
		if (rune && !isAlphanum(rune)) {
			// Iterate to an alphanumeric rune:
			while (index < state.data.length) {
				const substr = state.data.slice(index)
				const rune = emoji.atStart(substr) || atStart(substr)
				if (!rune || isAlphanum(rune) || isWhiteSpace(rune)) {
					// No-op
					break
				}
				index += rune.length
			}
		} else if (rune && isAlphanum(rune)) {
			// Iterate to a non-alphanumeric rune:
			while (index < state.data.length) {
				const substr = state.data.slice(index)
				const rune = emoji.atStart(substr) || atStart(substr)
				if (!rune || !isAlphanum(rune) || isWhiteSpace(rune)) {
					// No-op
					break
				}
				index += rune.length
			}
		}
		// Get the number of bytes to drop:
		let dropR = index - state.pos1.pos
		if (!dropR && index < state.data.length && state.data[index] === "\n") {
			dropR = 1
		}
		this.write("", 0, dropR)
	},
	tab() {
		this.write("\t")
	},
	enter() {
		this.write("\n")
	},
	cut() {
		this.newAction(EnumActionTypes.CUT)
		this.write("")
	},
	copy() {
		this.newAction(EnumActionTypes.COPY)
	},
	paste(substr) {
		this.newAction(EnumActionTypes.PASTE)
		this.write(substr)
	},
	storeUndo() {
		const undo = state.history.stack[state.history.index]
		if (undo.data.length === state.data.length && undo.data === state.data) {
			// No-op
			return
		}
		const { data, body, pos1, pos2 } = state
		state.history.stack.push({ data, body: body.map(each => ({ ...each })), pos1: { ...pos1 }, pos2: { ...pos2 } })
		state.history.index++
	},
	dropRedos() {
		state.history.stack.splice(state.history.index + 1)
	},
	undo() {
		if (state.prefs.readOnly || state.prefs.previewMode) {
			// No-op
			return
		}
		this.newAction(EnumActionTypes.UNDO)
		if (state.history.index === 1 && state.resetPos) {
			state.resetPos = false
		}
		// Guard decrement:
		if (state.history.index) {
			state.history.index--
		}
		const undo = state.history.stack[state.history.index]
		Object.assign(state, undo)
		this.render()
	},
	redo() {
		if (state.prefs.readOnly || state.prefs.previewMode) {
			// No-op
			return
		}
		this.newAction(EnumActionTypes.REDO)
		if (state.history.index + 1 === state.history.stack.length) {
			// No-op
			return
		}
		state.history.index++
		const redo = state.history.stack[state.history.index]
		Object.assign(state, redo)
		this.render()
	},
	render() {
		state.components = parse(state.body)
		state.shouldRender++
	},
	rendered() {
		state.didRender++
	},
})

const init = (data, prefs) => initialState => {
	const body = newNodes(data)
	const state = {
		...initialState,
		prefs: { ...initialState.prefs, ...prefs },
		data,
		body,
		components: parse(body),
		reactDOM: document.createElement("div"),
		history: { ...initialState.history, stack: [{ data, body, pos1: newPos(), pos2: newPos() }], index: 0 },
	}
	return state
}

const useEditor = (data, prefs) => useMethods(reducer, initialState, init(data, prefs))

export default useEditor
