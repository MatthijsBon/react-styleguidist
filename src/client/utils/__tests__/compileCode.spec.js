import compileCode from '../compileCode';
import config from '../../../scripts/schemas/config';

const compilerConfig = config.compilerConfig.default;

describe('compileCode', () => {
	test('compile ES6 to ES5', () => {
		const result = compileCode(`const {foo, bar} = baz`, compilerConfig);
		expect(result).toMatchInlineSnapshot(`
"var foo = baz.foo;
var bar = baz.bar;"
`);
	});

	test('transform imports to require()', () => {
		const result = compileCode(`import foo from 'bar'`, compilerConfig);
		expect(result).toMatchInlineSnapshot(`"const foo = require('bar');"`);
	});

	test('transform imports to require() in front of JSX', () => {
		const result = compileCode(
			`
import foo from 'bar';
import Button from 'button';
<Button />`,
			compilerConfig
		);
		expect(result).toMatchInlineSnapshot(`
"
const foo = require('bar');
const Button = require('button');
React.createElement( Button, null )"
`);
	});

	test('wrap JSX in Fragment', () => {
		const result = compileCode(
			`<div>
  <button>Click</button>
</div>`,
			compilerConfig
		);
		expect(result).toMatchInlineSnapshot(`
"React.createElement( React.Fragment, null, React.createElement( 'div', null,
  React.createElement( 'button', null, \\"Click\\" )
) );"
`);
	});

	test('don’t wrap JSX in Fragment if it’s in the middle', () => {
		const result = compileCode(
			`const {foo, bar} = baz;
<div>
  <button>Click</button>
</div>`,
			compilerConfig
		);
		expect(result).toMatchInlineSnapshot(`
"var foo = baz.foo;
var bar = baz.bar;
React.createElement( 'div', null,
  React.createElement( 'button', null, \\"Click\\" )
)"
`);
	});

	test('tagged template literals', () => {
		const result = compileCode(
			`const Button = styled.button\`
	color: tomato;
\`;
<Button />
`,
			compilerConfig
		);
		expect(result).toMatchInlineSnapshot(`
"var templateObject = Object.freeze([\\"\\\\n\\\\tcolor: tomato;\\\\n\\"]);
var Button = styled.button(templateObject);
React.createElement( Button, null )
"
`);
	});

	test('onError callback', () => {
		const onError = jest.fn();
		const result = compileCode(`=`, compilerConfig, onError);
		expect(result).toBe('');
		expect(onError).toHaveBeenCalledWith(
			expect.objectContaining({ message: 'Unexpected token (1:0)' })
		);
	});
});
