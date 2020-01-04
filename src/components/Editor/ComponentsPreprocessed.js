import React from "react"
import stylex from "stylex"

// export const types = {
// 	[Header.name]:     "Header",
// 	[Comment.name]:    "Comment",
// 	[Blockquote.name]: "Blockquote",
// 	[CodeBlock.name]:  "CodeBlock",
// 	[Paragraph.name]:  "Paragraph",
// 	[Break.name]:      "Break",
// }

// // `Node` is a higher-order component that decorates a
// // render function.
// const Node = render => ({ reactKey, ...props }) => {
// 	const element = render(props)
// 	const newRender = React.cloneElement(
// 		element,
// 		{
// 			"id": reactKey,
// 			"data-vdom-node": true, // reactKey, // Redundant.
// 			...element.props,
// 		},
// 	)
// 	return newRender
// }

const syntaxStyle = stylex.parse("c:blue-a400")

const Syntax = ({ style, ...props }) => (
	<span style={{ ...syntaxStyle, ...style }}>
		{props.children}
	</span>
)

const Markdown = ({ style, ...props }) => (
	<React.Fragment>
		{props.start && (
			<Syntax style={style}>
				{props.start}
			</Syntax>
		)}
		{props.children}
		{props.end && (
			<Syntax style={style}>
				{props.end}
			</Syntax>
		)}
	</React.Fragment>
)

const headersSyntax = {
	"# ":      "h1",
	"## ":     "h2",
	"### ":    "h3",
	"#### ":   "h4",
	"##### ":  "h5",
	"###### ": "h6",
}

const headerStyle = stylex.parse("fw:700 fs:19")

// FIXME: Add `m-t:28` in read-only mode.
const Header = props => {
	const TagName = headersSyntax[props.start]

	return (
		<TagName id={props.reactKey} style={headerStyle} data-vdom-node>
			<Markdown start={`${props.start.slice(0, -1)}\u00a0`}>
				{props.children}
			</Markdown>
		</TagName>
	)
}

const commentStyle = stylex.parse("fs:19 c:gray")
const commentMarkdownStyle = stylex.parse("c:gray")

const Comment = props => (
	<p id={props.reactKey} style={commentStyle} spellCheck={false} data-vdom-node>
		<Markdown style={commentMarkdownStyle} start="//">
			{props.children}
		</Markdown>
	</p>
)

const blockquoteItemStyle = stylex.parse("fs:19")

// Compound component.
const Blockquote = props => (
	<blockquote id={props.reactKey} data-vdom-node>
		<ul>
			{props.children.map(each => (
				<li key={each.key} id={each.key} style={blockquoteItemStyle} data-vdom-node>
					<Markdown start={each.isNewline ? ">" : ">\u00a0"}>
						{each.data || (
							each.isNewline && (
								<br />
							)
						)}
					</Markdown>
				</li>
			))}
		</ul>
	</blockquote>
)

const codeStyle = {
	MozTabSize: 2,
	tabSize: 2,
	font: "15px/1.375 Monaco",
}

const codeBlockStyle = {
	...stylex.parse("m-x:-24 p-y:16 b:gray-50 overflow -x:scroll"),
	...codeStyle,
	boxShadow: "0px 0px 1px hsl(var(--gray))",
}

const codeBlockItemCodeStyle = {
	...stylex.parse("p-x:24"),
	...codeStyle,
}

// Compound component.
//
// http://cdpn.io/PowjgOg
const CodeBlock = props => (
	<pre id={props.reactKey} style={codeBlockStyle} spellCheck={false} data-vdom-node>
		<ul>
			{props.children.map((each, index) => (
				<li key={each.key} id={each.key} data-vdom-node>
					<code style={codeBlockItemCodeStyle}>
						<Markdown
							start={!index && props.start}
							end={index + 1 === props.children.length && props.end}
						>
							{each.data || (
								index > 0 && index + 1 < props.children.length && (
									<br />
								)
							)}
						</Markdown>
					</code>
				</li>
			))}
		</ul>
	</pre>
)

const paragraphStyle = stylex.parse("fs:19")

const Paragraph = props => (
	<p id={props.reactKey} style={paragraphStyle} data-vdom-node>
		{props.children}
	</p>
)

const breakStyle = stylex.parse("fs:19 c:gray")

const Break = props => (
	<p id={props.reactKey} style={breakStyle} spellCheck={false} data-vdom-node>
		<Markdown start={props.start} />
	</p>
)

// Convenience function.
function isBlockquote(data, hasNextSibling) {
	const ok = (
		(data.length === 1 && data === ">" && hasNextSibling) || // Empty syntax.
		(data.length >= 2 && data.slice(0, 2) === "> ")
	)
	return ok
}

function parse(body) {
	const Components = []
	let index = 0
	while (index < body.nodes.length) {
		const {
			key,  // The current node’s key (hash).
			data, // The current node’s plain text data
		} = body.nodes[index]
		/* eslint-disable no-case-declarations */
		switch (true) {
		case (
			(data.length >= 2 && data.slice(0, 2) === ("# ")) ||
			(data.length >= 3 && data.slice(0, 3) === ("## ")) ||
			(data.length >= 4 && data.slice(0, 4) === ("### ")) ||
			(data.length >= 5 && data.slice(0, 5) === ("#### ")) ||
			(data.length >= 6 && data.slice(0, 6) === ("##### ")) ||
			(data.length >= 7 && data.slice(0, 7) === ("###### "))
		):
			const headerIndex = data.indexOf("# ")
			const headerStart = data.slice(0, headerIndex + 2)
			Components.push((
				<Header key={key} reactKey={key} start={headerStart}>
					{data.slice(headerIndex + 2) || (
						<br />
					)}
				</Header>
			))
			break
		case data.length >= 2 && data.slice(0, 2) === "//":
			Components.push((
				<Comment key={key} reactKey={key}>
					{data.slice(2) || (
						<br />
					)}
				</Comment>
			))
			break
		case isBlockquote(data, index + 1 < body.nodes.length):
			const bquoteStart = index
			index++
			while (index < body.nodes.length) {
				if (!isBlockquote(body.nodes[index].data, index + 1 < body.nodes.length)) {
					break
				}
				index++
			}
			const bquoteNodes = body.nodes.slice(bquoteStart, index)
			Components.push((
				<Blockquote key={key} reactKey={key}>
					{bquoteNodes.map(each => (
						{
							...each,
							isNewline: each.data.length === 1 && each.data === ">",
							data: each.data.slice(2),
						}
					))}
				</Blockquote>
			))
			// NOTE: Decrement because `index` will be auto-
			// incremented.
			index--
			break
		case (
			data.length >= 6 && (
				data.slice(0, 3) === "```" &&
				data.slice(-3) === "```"
			)
		):
			Components.push((
				<CodeBlock key={key} reactKey={key} start="```" end="```">
					{[
						{
							...body.nodes[index],
							data: data.slice(3, -3),
						},
					]}
				</CodeBlock>
			))
			break
		case data.length >= 3 && data.slice(0, 3) === "```":
			const cblockStart = index
			index++
			let cblockDidTerminate = false
			while (index < body.nodes.length) {
				if (body.nodes[index].data.length === 3 && body.nodes[index].data === "```") {
					cblockDidTerminate = true
					break
				}
				index++
			}
			index++
			if (!cblockDidTerminate) { // Unterminated code block.
				Components.push((
					<Paragraph key={key} reactKey={key}>
						{data || (
							<br />
						)}
					</Paragraph>
				))
				index = cblockStart
				break
			}
			const cblockNodes = body.nodes.slice(cblockStart, index)
			Components.push((
				<CodeBlock key={key} reactKey={key} start={data} end="```">
					{cblockNodes.map((each, index) => (
						{
							...each,
							data: !index || index + 1 === cblockNodes.length
								? ""
								: each.data,
						}
					))}
				</CodeBlock>
			))
			// NOTE: Decrement because `index` will be auto-
			// incremented.
			index--
			break
		case (
			data.length === 3 && (
				data === "***" ||
				data === "---"
			)
		):
			Components.push(<Break key={key} reactKey={key} start={data} />)
			break
		default:
			Components.push((
				<Paragraph key={key} reactKey={key}>
					{data || (
						<br />
					)}
				</Paragraph>
			))
			break
		}
		index++
	}
	/* eslint-enable no-case-declarations */
	return Components
}

export default parse