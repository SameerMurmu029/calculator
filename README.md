# Modern Dark-Themed Calculator & Unit Converter

A high-fidelity, premium, dark-themed **Calculator** and **Unit Converter** web application built with HTML, CSS, and vanilla JavaScript. Inspired by modern design aesthetics (glassmorphism, clean typography, and interactive micro-animations) and conforming to mathematical operator precedence.

---

## ✨ Features

### 1. General Interface
- **Premium Aesthetics**: Centered card design with rounded corners, drop shadows, inset highlight borders, and subtle page gradient backdrops (`#0b0c0e`).
- **Smooth Navigation**: Sliding underline tab indicator to transition between **Calculator** and **Converter** views.
- **Micro-Animations**: Pressed scale states (`active:scale-95`) on buttons and smooth transition toggles on dropdown selections.

### 2. Math Calculation Engine (BODMAS)
- **Mathematical Precedence**: Parses and evaluates input expressions according to **BODMAS/PEMDAS** rules (brackets, division/multiplication, addition/subtraction) using the **Shunting-Yard algorithm** and stack evaluation.
- **Dynamic Parentheses**: Dynamically inserts opening `(` or closing `)` brackets based on unmatched paren counts and typing context.
- **Implicit Multiplication**: Automatically translates algebraic notations like `2(3+4)` to `2 × (3 + 4)`.
- **Auto-Bracket Balancing**: Automatically balances unmatched open brackets when evaluating expressions on equals click.
- **History Tracking**: The top history line displays the complete equation being built (e.g., `2 + 3 × (4 − 1) = 11`), while the main display shows the active number being typed.
- **Smart Clear (C)**: Single-clear resets the active entry and operator highlights but retains the finished history display. Double-clear resets history and the active math token list.
- **Smart Backspace**: Pop operator tokens, parenthesis brackets, or restore preceding operand values from the expression list when deleting inputs.
- **Floating Point Correction**: Rounding adjustments up to 12 digits to prevent float inaccuracies (e.g. `0.1 × (0.2 + 0.1)` yields `0.03` instead of `0.030000000000000004`).

### 3. Glassmorphic Unit Converter
- **Custom Select Elements**: Replaces blocky native browser `<select>` dropdowns with beautiful, custom-animated glassmorphic select lists (`backdrop-filter: blur(16px)`).
- **Bi-Directional Conversions**: Allows users to select either the **From** or **To** unit value row as the active input source to convert in both directions.
- **Supported Categories**:
  - **Length**: Meters, Kilometers, Centimeters, Millimeters, Inches, Feet, Yards, Miles.
  - **Weight**: Kilograms, Grams, Milligrams, Pounds, Ounces.
  - **Temperature**: Celsius, Fahrenheit, Kelvin.
- **Contextual Keypad Mapping**: Automatically mutes mathematical operators and limits keypad clicks to numbers and decimal inputs when in Converter view (retaining sign toggles for Temperature).

---

## ⌨️ Keyboard Shortcuts

The application captures keyboard inputs for efficient, mouse-free calculations:

| Key | Action |
| :--- | :--- |
| `0` - `9` | Input Digits |
| `.` | Decimal Point |
| `+`, `-`, `*`, `/` | Addition, Subtraction, Multiplication (`×`), Division (`÷`) |
| `(`, `)` | Parentheses Brackets |
| `Enter`, `=` | Evaluate Expression |
| `%` | Percentage |
| `Backspace` | Deletes last character, pops operators, or restores operands |
| `Escape`, `c`, `C` | Clear |

---

## 📂 File Structure

The project workspace consists of three modular files:
- **`index.html`**: Structured semantic markup, viewport responsiveness tags, and custom icon structures.
- **`index.css`**: CSS variables for colors (accent orange `#ff6b4a`, soft red `#ff5e5e`, and dark gray scales), glassmorphic lists, and keypads.
- **`index.js`**: Core math algorithms, stack machines, bi-directional conversion calculations, and dropdown synchronization handlers.

---

## 🚀 Running Locally

1. Clone or copy the project files to a local directory.
2. Serve the directory using any local web server. For example, using Python:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.
