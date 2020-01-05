// `computeCurrentDOMRect` computes the current DOMRect.
function computeCurrentDOMRect() {
	const selection = document.getSelection()
	if (!selection.anchorNode) {
		// No-op.
		return null
	}
	const domRects = selection.getRangeAt(0).getClientRects() // E.g. cursor.
	if (!domRects.length) {
		if (!selection.anchorNode.getBoundingClientRect) {
			// No-op.
			return null
		}
		// Return the anchor node:
		return selection.anchorNode.getBoundingClientRect()
	}
	return domRects[0]
}

// `computeCurrentBounds` computes the current bounds.
function computeCurrentBounds(domRect, offset) {
	/* eslint-disable */
	const bounds = {
		l:  window.scrollX + (domRect.x - (offset.left || 0)),
		t:  window.scrollY + (domRect.y - (offset.top  || 0)),
		r: (window.scrollX - window.innerWidth ) + (domRect.x + domRect.width  + (offset.right  || 0)),
		b: (window.scrollY - window.innerHeight) + (domRect.y + domRect.height + (offset.bottom || 0)),
	}
	/* eslint-enable */
	return bounds
}

// `computeCoordsScrollTo` computes the nearest x- and y-
// axis coords for `window.scrollTo`.
//
// TODO: Test x-axis.
function computeCoordsScrollTo(offset = { left: 0, right: 0, top: 0, bottom: 0 }) {
	const domRect = computeCurrentDOMRect()
	if (!domRect) {
		return { x: -1, y: -1 }
	}
	const bounds = computeCurrentBounds(domRect, offset)
	const coords = {
		x: 0, // The nearest x-axis point.
		y: 0, // The nearest y-axis point.
	}
	if (window.scrollX > bounds.l) {
		coords.x = bounds.l
	} else if (window.scrollX < bounds.r) {
		coords.x = bounds.r
	}
	if (window.scrollY > bounds.t) {
		coords.y = bounds.t
	} else if (window.scrollY < bounds.b) {
		coords.y = bounds.b
	}
	return coords
}

export default computeCoordsScrollTo