import * as constants from "__constants"
import * as ProgressBar from "components/ProgressBar"
import * as random from "utils/random"
import * as Router from "react-router-dom"
import * as User from "components/User"
import Auth from "components/Auth"
import Demo from "components/Demo"
import Home from "components/Home"
import React from "react"

const App = props => (
	<Router.BrowserRouter>
		<User.Provider>
			<ProgressBar.Provider>
				<ProgressBar.ProgressBar />
				<Router.Switch>

					{/* <User.UnprotectedRoute */}
					{/* 	path="/" */}
					{/* 	exact */}
					{/* 	title="" */}
					{/* 	children={<Home />} */}
					{/* /> */}

					<User.UnprotectedRoute
						path={constants.PATH_AUTH}
						title="Open your Codex"
						children={<Auth />}
					/>
					<User.UnprotectedRoute
						path={constants.PATH_DEMO}
						exact
						title="Demo"
						children={<Demo />}
					/>

					<User.Context.Consumer>
						{user => !user ? (
							// Unauthenticated users:
							<User.UnprotectedRoute path={constants.PATH_HOME} exact>
								<Home key={random.newFourByteHash()} />
							</User.UnprotectedRoute>
						) : (
							// Authenticated users:
							<User.ProtectedRoute path={constants.PATH_HOME} exact>
								<Home key={random.newFourByteHash()} />
							</User.ProtectedRoute>
						)}
					</User.Context.Consumer>

					{/* <User.UnprotectedRoute */}
					{/* 	path="/our-story" */}
					{/* 	exact */}
					{/* 	title="Our story" */}
					{/* 	component={props => "TODO"} */}
					{/* /> */}
					{/* <User.UnprotectedRoute */}
					{/* 	path="/features" */}
					{/* 	exact */}
					{/* 	title="Features" */}
					{/* 	component={props => "TODO"} */}
					{/* /> */}
					{/* <User.UnprotectedRoute */}
					{/* 	path="/pricing" */}
					{/* 	exact */}
					{/* 	title="Pricing" */}
					{/* 	component={props => "TODO"} */}
					{/* /> */}
					{/* <User.UnprotectedRoute */}
					{/* 	path="/faq" */}
					{/* 	exact */}
					{/* 	title="FAQ" */}
					{/* 	component={props => "TODO"} */}
					{/* /> */}
					{/* <User.UnprotectedRoute */}
					{/* 	path="/sign-up" */}
					{/* 	exact */}
					{/* 	title="Sign up" */}
					{/* 	component={Forms.SignUpFlow} */}
					{/* /> */}
					{/* <User.UnprotectedRoute */}
					{/* 	path="/sign-in" */}
					{/* 	exact */}
					{/* 	title="Sign in" */}
					{/* 	component={Forms.SignIn} */}
					{/* /> */}
					{/* <User.UnprotectedRoute */}
					{/* 	path="/reset-password" */}
					{/* 	exact */}
					{/* 	title="Reset password" */}
					{/* 	component={Forms.ResetPassword} */}
					{/* /> */}

				</Router.Switch>
			</ProgressBar.Provider>
		</User.Provider>
	</Router.BrowserRouter>
)

export default App
