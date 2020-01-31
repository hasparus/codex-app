import FirefoxEditor from "components/FirefoxEditor"
import React from "react"
import stylex from "stylex"

const FirefoxEditorApp = props => (
	<div style={stylex.parse("p-x:24 p-y:128 flex -r -x:center")}>
		<div style={stylex.parse("w:834 no-min-w")}>
			<FirefoxEditor
				// state={state}
				// dispatch={dispatch}
				// scrollPastEnd
				// statusBar
				// debugger
			/>
		</div>
	</div>
)

export default FirefoxEditorApp