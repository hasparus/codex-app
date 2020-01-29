import Markdown from "./ComponentsText"
import React from "react"
import stylex from "stylex"

// // https://reactjs.org/docs/react-api.html#reactmemo
// function compoundAreEqual(prev, next) {
// 	// console.log(prev, next)
// 	if (prev.reactKey !== next.reactKey) {
// 		return false
// 	} else if (prev.children.length !== next.children.length) {
// 		return false
// 	}
// 	let index = 0
// 	const { length } = prev.children
// 	while (index < length) {
// 		const p = prev.children[index]
// 		const n = next.children[index]
// 		if (p.key !== n.key || p.data !== n.data) {
// 			return false
// 		}
// 		index++
// 	}
// 	return true
// }

export const Header = React.memo(({ reactKey, ...props }) => (
	<div id={reactKey} style={stylex.parse("fw:700")} data-node data-memo={Date.now()}>
		<Markdown startSyntax={props.startSyntax}>
			{props.children || (
				<br />
			)}
		</Markdown>
	</div>
))

export const Comment = React.memo(({ reactKey, ...props }) => (
	<div id={reactKey} style={stylex.parse("c:gray")} data-node data-memo={Date.now()} spellCheck={false}>
		<Markdown style={stylex.parse("c:gray")} startSyntax={props.startSyntax}>
			{props.children || (
				<br />
			)}
		</Markdown>
	</div>
))

export const Blockquote = React.memo(({ reactKey, ...props }) => (
	<div id={reactKey} data-compound-node data-memo={Date.now()}>
		{props.children.map(each => (
			<div key={each.key} id={each.key} data-node>
				<Markdown startSyntax={each.startSyntax}>
					{each.data || (
						!(each.startSyntax + each.data) && (
							<br />
						)
					)}
				</Markdown>
			</div>
		))}
	</div>
)) // , compoundAreEqual)

// https://cdpn.io/PowjgOg
export const CodeBlock = React.memo(({ reactKey, ...props }) => (
	<div
		id={reactKey}
		style={{
			...stylex.parse("m-x:-24 p-x:24 pre overflow -x:scroll"),
			boxShadow: "0px 0px 1px hsl(var(--gray))",
		}}
		data-compound-node
		data-memo={Date.now()}
		spellCheck={false}
	>
		{props.children.map((each, index) => (
			<div key={each.key} id={each.key} data-node>
				<span style={stylex.parse("m-r:-24 p-r:24")}>
					<Markdown
						startSyntax={!index && props.startSyntax}
						endSyntax={index + 1 === props.children.length && props.endSyntax}
					>
						{each.data || (
							index > 0 && index + 1 < props.children.length && (
								<br />
							)
						)}
					</Markdown>
				</span>
			</div>
		))}
	</div>
)) // , compoundAreEqual)

export const Paragraph = React.memo(({ reactKey, ...props }) => (
	<div id={reactKey} data-node data-memo={Date.now()}>
		{props.children || (
			<br />
		)}
	</div>
))

export const Break = React.memo(({ reactKey, ...props }) => (
	<div id={reactKey} style={stylex.parse("c:gray")} data-node data-memo={Date.now()} spellCheck={false}>
		<Markdown startSyntax={props.startSyntax} />
	</div>
))
