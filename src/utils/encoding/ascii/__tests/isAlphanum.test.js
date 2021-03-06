import isAlphanum from "../isAlphanum.js"

test("isAlphanum", () => {
	expect(isAlphanum("")).toBe(false)
	expect(isAlphanum(" ")).toBe(false)
	expect(isAlphanum("\t")).toBe(false)
	expect(isAlphanum("\n")).toBe(false)
	expect(isAlphanum("a")).toBe(true)
	expect(isAlphanum("b")).toBe(true)
	expect(isAlphanum("c")).toBe(true)
	expect(isAlphanum("d")).toBe(true)
	expect(isAlphanum("e")).toBe(true)
	expect(isAlphanum("f")).toBe(true)
	expect(isAlphanum("g")).toBe(true)
	expect(isAlphanum("h")).toBe(true)
	expect(isAlphanum("i")).toBe(true)
	expect(isAlphanum("j")).toBe(true)
	expect(isAlphanum("k")).toBe(true)
	expect(isAlphanum("l")).toBe(true)
	expect(isAlphanum("m")).toBe(true)
	expect(isAlphanum("n")).toBe(true)
	expect(isAlphanum("o")).toBe(true)
	expect(isAlphanum("p")).toBe(true)
	expect(isAlphanum("q")).toBe(true)
	expect(isAlphanum("r")).toBe(true)
	expect(isAlphanum("s")).toBe(true)
	expect(isAlphanum("t")).toBe(true)
	expect(isAlphanum("u")).toBe(true)
	expect(isAlphanum("v")).toBe(true)
	expect(isAlphanum("w")).toBe(true)
	expect(isAlphanum("x")).toBe(true)
	expect(isAlphanum("y")).toBe(true)
	expect(isAlphanum("z")).toBe(true)
	expect(isAlphanum("A")).toBe(true)
	expect(isAlphanum("B")).toBe(true)
	expect(isAlphanum("C")).toBe(true)
	expect(isAlphanum("D")).toBe(true)
	expect(isAlphanum("E")).toBe(true)
	expect(isAlphanum("F")).toBe(true)
	expect(isAlphanum("G")).toBe(true)
	expect(isAlphanum("H")).toBe(true)
	expect(isAlphanum("I")).toBe(true)
	expect(isAlphanum("J")).toBe(true)
	expect(isAlphanum("K")).toBe(true)
	expect(isAlphanum("L")).toBe(true)
	expect(isAlphanum("M")).toBe(true)
	expect(isAlphanum("N")).toBe(true)
	expect(isAlphanum("O")).toBe(true)
	expect(isAlphanum("P")).toBe(true)
	expect(isAlphanum("Q")).toBe(true)
	expect(isAlphanum("R")).toBe(true)
	expect(isAlphanum("S")).toBe(true)
	expect(isAlphanum("T")).toBe(true)
	expect(isAlphanum("U")).toBe(true)
	expect(isAlphanum("V")).toBe(true)
	expect(isAlphanum("W")).toBe(true)
	expect(isAlphanum("X")).toBe(true)
	expect(isAlphanum("Y")).toBe(true)
	expect(isAlphanum("Z")).toBe(true)
	expect(isAlphanum("0")).toBe(true)
	expect(isAlphanum("1")).toBe(true)
	expect(isAlphanum("2")).toBe(true)
	expect(isAlphanum("3")).toBe(true)
	expect(isAlphanum("4")).toBe(true)
	expect(isAlphanum("5")).toBe(true)
	expect(isAlphanum("6")).toBe(true)
	expect(isAlphanum("7")).toBe(true)
	expect(isAlphanum("8")).toBe(true)
	expect(isAlphanum("9")).toBe(true)
	expect(isAlphanum("_")).toBe(true)
})
