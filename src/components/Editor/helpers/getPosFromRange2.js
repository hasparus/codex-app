// Gets the cursor from a range. Code based on innerText.
function getPosFromRange2(rootNode, node, offset) {
	const pos = {
		x: 0,   // The character index (of the current paragraph)
		y: 0,   // The paragraph index
		pos: 0, // The cursor position
	}
	// NOTE: Gecko/Firefox can select the end element node
	if (node.nodeType === Node.ELEMENT_NODE && offset && !(offset < node.childNodes.length)) {
		// return getPosFromRange2(rootNode, null, 0)
		node = null
		offset = 0
	}
	const recurse = startNode => {
		const { childNodes } = startNode
		let index = 0
		while (index < childNodes.length) {
			if (childNodes[index] === node) {
				Object.assign(pos, {
					x: pos.x + offset,
					pos: pos.pos + offset,
				})
				return true
			}
			const { length } = (childNodes[index].nodeValue || "")
			Object.assign(pos, {
				x: pos.x + length,
				pos: pos.pos + length,
			})
			if (recurse(childNodes[index])) {
				return true
			}
			const { nextSibling } = childNodes[index]
			if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE &&
					// nextSibling.hasAttribute("data-node")) {
					(nextSibling.hasAttribute("data-compound-node") || nextSibling.hasAttribute("data-node"))) {
				Object.assign(pos, {
					x: 0, // Reset
					y: pos.y + 1,
					pos: pos.pos + 1,
				})
			}
			index++
		}
		return false
	}
	recurse(rootNode)
	return pos
}

export default getPosFromRange2
