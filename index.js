document.addEventListener('DOMContentLoaded', () => {
    // Tab switching elements
    const tabCalculator = document.getElementById('tab-calculator');
    const tabConverter = document.getElementById('tab-converter');
    const tabUnderline = document.querySelector('.tab-underline');
    const calculatorView = document.getElementById('calculator-view');
    const converterView = document.getElementById('converter-view');

    // Calculator displays
    const calcHistory = document.getElementById('calc-history');
    const calcCurrent = document.getElementById('calc-current');

    // Converter elements
    const converterCategory = document.getElementById('converter-category');
    const converterFromUnit = document.getElementById('converter-from-unit');
    const converterToUnit = document.getElementById('converter-to-unit');
    const converterFromValue = document.getElementById('converter-from-value');
    const converterToValue = document.getElementById('converter-to-value');
    const converterFromContainer = document.getElementById('converter-from-container');
    const converterToContainer = document.getElementById('converter-to-container');

    // Operator keys
    const opDivide = document.getElementById('key-divide');
    const opMultiply = document.getElementById('key-multiply');
    const opSubtract = document.getElementById('key-subtract');
    const opAdd = document.getElementById('key-add');
    const opButtons = {
        'divide': opDivide,
        'multiply': opMultiply,
        'subtract': opSubtract,
        'add': opAdd
    };

    // --- State Variables ---
    let currentTab = 'calculator'; // 'calculator' or 'converter'
    
    // Calculator state (BODMAS-compatible token accumulator)
    let calcState = {
        currentValue: '0', // The active digits being typed
        expression: [], // Tokens array: numbers, operators, brackets, e.g. ['2', '+', '(', '3', '×', '4', ')']
        shouldResetInput: false, // Flag to overwrite currentValue on next number entry
        lastResult: null // Store last evaluation result
    };

    // Converter state
    let converterState = {
        activeField: 'from', // 'from' or 'to'
        fromValue: '0',
        toValue: '0',
        units: {
            length: {
                unitsList: [
                    { value: 'm', label: 'Meter (m)', ratio: 1 },
                    { value: 'km', label: 'Kilometer (km)', ratio: 1000 },
                    { value: 'cm', label: 'Centimeter (cm)', ratio: 0.01 },
                    { value: 'mm', label: 'Millimeter (mm)', ratio: 0.001 },
                    { value: 'in', label: 'Inch (in)', ratio: 0.0254 },
                    { value: 'ft', label: 'Foot (ft)', ratio: 0.3048 },
                    { value: 'yd', label: 'Yard (yd)', ratio: 0.9144 },
                    { value: 'mi', label: 'Mile (mi)', ratio: 1609.344 }
                ],
                defaultFrom: 'm',
                defaultTo: 'ft'
            },
            weight: {
                unitsList: [
                    { value: 'kg', label: 'Kilogram (kg)', ratio: 1 },
                    { value: 'g', label: 'Gram (g)', ratio: 0.001 },
                    { value: 'mg', label: 'Milligram (mg)', ratio: 0.000001 },
                    { value: 'lb', label: 'Pound (lb)', ratio: 0.45359237 },
                    { value: 'oz', label: 'Ounce (oz)', ratio: 0.028349523 }
                ],
                defaultFrom: 'kg',
                defaultTo: 'lb'
            },
            temperature: {
                unitsList: [
                    { value: 'C', label: 'Celsius (°C)' },
                    { value: 'F', label: 'Fahrenheit (°F)' },
                    { value: 'K', label: 'Kelvin (K)' }
                ],
                defaultFrom: 'C',
                defaultTo: 'F'
            }
        }
    };

    // --- Tab Switching Logic ---
    function updateTabUnderline() {
        if (currentTab === 'calculator') {
            tabUnderline.style.transform = 'translateX(0)';
            tabCalculator.classList.add('active');
            tabCalculator.setAttribute('aria-selected', 'true');
            tabConverter.classList.remove('active');
            tabConverter.setAttribute('aria-selected', 'false');
            
            calculatorView.classList.add('active');
            calculatorView.setAttribute('aria-hidden', 'false');
            converterView.classList.remove('active');
            converterView.setAttribute('aria-hidden', 'true');
            
            enableCalculatorKeys();
        } else {
            tabUnderline.style.transform = 'translateX(100%)';
            tabConverter.classList.add('active');
            tabConverter.setAttribute('aria-selected', 'true');
            tabCalculator.classList.remove('active');
            tabCalculator.setAttribute('aria-selected', 'false');
            
            converterView.classList.add('active');
            converterView.setAttribute('aria-hidden', 'false');
            calculatorView.classList.remove('active');
            calculatorView.setAttribute('aria-hidden', 'true');
            
            initConverterUnits();
            disableNonConverterKeys();
        }
    }

    tabCalculator.addEventListener('click', () => {
        if (currentTab !== 'calculator') {
            currentTab = 'calculator';
            updateTabUnderline();
        }
    });

    tabConverter.addEventListener('click', () => {
        if (currentTab !== 'converter') {
            currentTab = 'converter';
            updateTabUnderline();
        }
    });

    // --- Keypad Enable / Disable helper for Converter view ---
    function disableNonConverterKeys() {
        const disabledKeys = ['key-multiply', 'key-divide', 'key-subtract', 'key-add', 'key-equals', 'key-parenthesis', 'key-percent'];
        disabledKeys.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('disabled-btn');
        });
        
        const signEl = document.getElementById('key-sign');
        if (signEl) {
            if (converterCategory.value === 'temperature') {
                signEl.classList.remove('disabled-btn');
            } else {
                signEl.classList.add('disabled-btn');
            }
        }
    }

    function enableCalculatorKeys() {
        const allKeys = ['key-multiply', 'key-divide', 'key-subtract', 'key-add', 'key-equals', 'key-parenthesis', 'key-percent', 'key-sign'];
        allKeys.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('disabled-btn');
        });
        clearActiveOperatorHighlight();
    }

    // --- Calculator Engine Logic ---
    
    function formatDisplayNumber(numStr) {
        if (numStr === 'Error' || numStr === 'Infinity' || numStr === '-Infinity' || numStr === 'NaN') {
            return numStr;
        }
        
        const num = parseFloat(numStr);
        if (isNaN(num)) return '0';
        
        if (numStr.endsWith('.')) {
            return parseFloat(numStr).toLocaleString('en-US') + '.';
        }
        
        if (numStr.includes('.')) {
            const parts = numStr.split('.');
            const integerPart = parseFloat(parts[0]).toLocaleString('en-US');
            return integerPart + '.' + parts[1];
        }
        
        return num.toLocaleString('en-US', { maximumFractionDigits: 10 });
    }

    function updateHistoryDisplay() {
        let tokensToShow = [...calcState.expression];
        const isTypingNumber = (calcState.currentValue !== '0' && !calcState.shouldResetInput);
        if (isTypingNumber) {
            tokensToShow.push(calcState.currentValue);
        }
        
        const historyText = tokensToShow.map(token => {
            if (['+', '−', '×', '÷', '(', ')'].includes(token)) {
                return token;
            }
            return formatDisplayNumber(token);
        }).join(' ');
        
        calcHistory.textContent = historyText.trim() || ' ';
    }

    function clearActiveOperatorHighlight() {
        Object.values(opButtons).forEach(btn => {
            if (btn) btn.classList.remove('active-operator');
        });
    }

    function highlightActiveOperator(op) {
        clearActiveOperatorHighlight();
        if (op && opButtons[op]) {
            opButtons[op].classList.add('active-operator');
        }
    }

    function executeCalculation(a, b, op) {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (isNaN(numA) || isNaN(numB)) return 0;
        
        let result = 0;
        switch (op) {
            case 'add':
                result = numA + numB;
                break;
            case 'subtract':
                result = numA - numB;
                break;
            case 'multiply':
                result = numA * numB;
                break;
            case 'divide':
                if (numB === 0) return 'Error';
                result = numA / numB;
                break;
            default:
                return numB;
        }
        
        return parseFloat(result.toFixed(12));
    }

    // Shunting-Yard Algorithm to implement BODMAS rules
    function evaluateExpressionList(tokens) {
        if (tokens.length === 0) return 0;

        // Auto-balance parentheses (append closing brackets at the end if unmatched)
        let openBrackets = 0;
        let closeBrackets = 0;
        tokens.forEach(t => {
            if (t === '(') openBrackets++;
            if (t === ')') closeBrackets++;
        });
        
        const balancedTokens = [...tokens];
        if (openBrackets > closeBrackets) {
            for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                balancedTokens.push(')');
            }
        }

        // Postfix conversion
        const outputQueue = [];
        const operatorStack = [];
        const precedence = {
            '+': 1,
            '−': 1,
            '×': 2,
            '÷': 2
        };

        for (let i = 0; i < balancedTokens.length; i++) {
            const token = balancedTokens[i];
            
            if (!isNaN(parseFloat(token)) && isFinite(token)) {
                outputQueue.push(token);
            } else if (['+', '−', '×', '÷'].includes(token)) {
                while (operatorStack.length > 0) {
                    const topOp = operatorStack[operatorStack.length - 1];
                    if (['+', '−', '×', '÷'].includes(topOp) && precedence[topOp] >= precedence[token]) {
                        outputQueue.push(operatorStack.pop());
                    } else {
                        break;
                    }
                }
                operatorStack.push(token);
            } else if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length > 0) {
                    const topOp = operatorStack[operatorStack.length - 1];
                    if (topOp === '(') {
                        operatorStack.pop();
                        break;
                    } else {
                        outputQueue.push(operatorStack.pop());
                    }
                }
            }
        }

        while (operatorStack.length > 0) {
            outputQueue.push(operatorStack.pop());
        }

        // Postfix Stack Evaluation
        const evalStack = [];
        for (let i = 0; i < outputQueue.length; i++) {
            const token = outputQueue[i];
            if (!isNaN(parseFloat(token)) && isFinite(token)) {
                evalStack.push(parseFloat(token));
            } else if (['+', '−', '×', '÷'].includes(token)) {
                if (evalStack.length < 2) return 'Error';
                const b = evalStack.pop();
                const a = evalStack.pop();
                let op = '';
                if (token === '+') op = 'add';
                else if (token === '−') op = 'subtract';
                else if (token === '×') op = 'multiply';
                else if (token === '÷') op = 'divide';
                
                const result = executeCalculation(a, b, op);
                if (result === 'Error') return 'Error';
                evalStack.push(result);
            }
        }

        if (evalStack.length !== 1) return 'Error';
        return evalStack[0];
    }

    function handleNumber(num) {
        const isShowingPreviousResult = calcHistory.textContent.includes('=');
        
        if (calcState.shouldResetInput || calcState.currentValue === '0' || calcState.currentValue === 'Error') {
            if (isShowingPreviousResult) {
                calcState.expression = [];
                calcHistory.innerHTML = '&nbsp;';
            }
            calcState.currentValue = num;
            calcState.shouldResetInput = false;
        } else {
            if (calcState.currentValue.replace(/[.,-]/g, '').length < 15) {
                calcState.currentValue += num;
            }
        }
        calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
        updateHistoryDisplay();
        clearActiveOperatorHighlight();
    }

    function handleDecimal() {
        const isShowingPreviousResult = calcHistory.textContent.includes('=');
        
        if (calcState.shouldResetInput || calcState.currentValue === 'Error') {
            if (isShowingPreviousResult) {
                calcState.expression = [];
                calcHistory.innerHTML = '&nbsp;';
            }
            calcState.currentValue = '0.';
            calcState.shouldResetInput = false;
        } else if (!calcState.currentValue.includes('.')) {
            calcState.currentValue += '.';
        }
        calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
        updateHistoryDisplay();
    }

    function handleOperator(op) {
        if (calcState.currentValue === 'Error') return;
        
        const opSymbol = getOperatorSymbol(op);
        const isShowingPreviousResult = calcHistory.textContent.includes('=');
        
        // 1. Chain operations if we just pressed equals
        if (isShowingPreviousResult) {
            calcState.expression = [calcState.currentValue, opSymbol];
            calcState.shouldResetInput = true;
            calcState.currentValue = '0';
            updateHistoryDisplay();
            highlightActiveOperator(op);
            return;
        }
        
        // 2. Replace operator if user presses another operator consecutively, or if the active typing input is '0'
        if (calcState.expression.length > 0) {
            const lastToken = calcState.expression[calcState.expression.length - 1];
            if (['+', '−', '×', '÷'].includes(lastToken) && (calcState.shouldResetInput || calcState.currentValue === '0')) {
                calcState.expression[calcState.expression.length - 1] = opSymbol;
                calcState.currentValue = '0';
                calcState.shouldResetInput = true;
                updateHistoryDisplay();
                highlightActiveOperator(op);
                return;
            }
        }
        
        // 3. Commit number if actively typing
        const isTypingNumber = (calcState.currentValue !== '0' && !calcState.shouldResetInput);
        if (isTypingNumber) {
            calcState.expression.push(calcState.currentValue);
        } else if (calcState.expression.length === 0) {
            calcState.expression.push('0'); // Fallback for starting with an operator
        }
        
        calcState.expression.push(opSymbol);
        calcState.currentValue = '0';
        calcState.shouldResetInput = true;
        updateHistoryDisplay();
        highlightActiveOperator(op);
    }

    function getOperatorSymbol(op) {
        switch (op) {
            case 'add': return '+';
            case 'subtract': return '−';
            case 'multiply': return '×';
            case 'divide': return '÷';
            default: return '';
        }
    }

    function handleEquals() {
        if (calcState.currentValue === 'Error') return;
        
        const isShowingPreviousResult = calcHistory.textContent.includes('=');
        if (isShowingPreviousResult) return; // Do nothing if expression is already evaluated
        
        const isTypingNumber = (calcState.currentValue !== '0' && !calcState.shouldResetInput);
        if (isTypingNumber) {
            calcState.expression.push(calcState.currentValue);
        }
        
        if (calcState.expression.length === 0) return;
        
        // Balance brackets visually for full expression string representation
        let openBrackets = 0;
        let closeBrackets = 0;
        calcState.expression.forEach(t => {
            if (t === '(') openBrackets++;
            if (t === ')') closeBrackets++;
        });
        
        const displayExpression = [...calcState.expression];
        if (openBrackets > closeBrackets) {
            for (let i = 0; i < (openBrackets - closeBrackets); i++) {
                displayExpression.push(')');
            }
        }
        
        const result = evaluateExpressionList(calcState.expression);
        if (result === 'Error') {
            calcState.currentValue = 'Error';
            calcState.expression = [];
            calcHistory.textContent = ' ';
            calcCurrent.textContent = 'Error';
            clearActiveOperatorHighlight();
            return;
        }

        // Output history format: "2 + 3 × (4 − 1) = 11"
        const formattedHistory = displayExpression.map(token => {
            if (['+', '−', '×', '÷', '(', ')'].includes(token)) return token;
            return formatDisplayNumber(token);
        }).join(' ') + ` = ${formatDisplayNumber(result.toString())}`;
        
        calcHistory.textContent = formattedHistory;
        calcState.currentValue = result.toString();
        calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
        calcState.shouldResetInput = true;
        clearActiveOperatorHighlight();
    }

    function handleClear() {
        if (currentTab === 'calculator') {
            // Single Clear: reset display and cancel current expression
            // If already 0, wipe history
            if (calcState.currentValue === '0') {
                calcHistory.innerHTML = '&nbsp;';
                calcState.expression = [];
            } else {
                calcState.currentValue = '0';
                calcCurrent.textContent = '0';
                calcState.expression = [];
                if (!calcHistory.textContent.includes('=')) {
                    calcHistory.innerHTML = '&nbsp;';
                }
            }
            clearActiveOperatorHighlight();
        } else {
            if (converterState.activeField === 'from') {
                converterState.fromValue = '0';
                converterFromValue.textContent = '0';
            } else {
                converterState.toValue = '0';
                converterToValue.textContent = '0';
            }
            performConversion();
        }
    }

    function handleToggleSign() {
        if (currentTab === 'calculator') {
            if (calcState.currentValue === 'Error' || calcState.currentValue === '0') return;
            
            if (calcState.currentValue.startsWith('-')) {
                calcState.currentValue = calcState.currentValue.slice(1);
            } else {
                calcState.currentValue = '-' + calcState.currentValue;
            }
            calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
            updateHistoryDisplay();
        } else {
            if (converterCategory.value === 'temperature') {
                let activeValue = converterState.activeField === 'from' ? converterState.fromValue : converterState.toValue;
                if (activeValue === '0') return;
                
                if (activeValue.startsWith('-')) {
                    activeValue = activeValue.slice(1);
                } else {
                    activeValue = '-' + activeValue;
                }
                
                if (converterState.activeField === 'from') {
                    converterState.fromValue = activeValue;
                    converterFromValue.textContent = formatConverterDisplay(activeValue);
                } else {
                    converterState.toValue = activeValue;
                    converterToValue.textContent = formatConverterDisplay(activeValue);
                }
                performConversion();
            }
        }
    }

    function handlePercent() {
        if (calcState.currentValue === 'Error') return;
        
        const num = parseFloat(calcState.currentValue);
        if (isNaN(num)) return;
        
        // Algebra percentage behaves as / 100 on the active value
        const result = num / 100;
        calcState.currentValue = parseFloat(result.toFixed(12)).toString();
        calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
        updateHistoryDisplay();
    }

    function handleBackspace() {
        const isShowingPreviousResult = calcHistory.textContent.includes('=');
        if (isShowingPreviousResult) {
            calcState.expression = [];
            calcState.currentValue = '0';
            calcState.shouldResetInput = false;
            calcHistory.innerHTML = '&nbsp;';
            calcCurrent.textContent = '0';
            return;
        }
        
        const isTypingNumber = (calcState.currentValue !== '0' && !calcState.shouldResetInput);
        if (isTypingNumber) {
            if (calcState.currentValue.length > 1) {
                calcState.currentValue = calcState.currentValue.slice(0, -1);
                if (calcState.currentValue === '-') calcState.currentValue = '0';
            } else {
                calcState.currentValue = '0';
            }
            calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
            updateHistoryDisplay();
            return;
        }
        
        if (calcState.expression.length > 0) {
            const lastToken = calcState.expression[calcState.expression.length - 1];
            
            if (['+', '−', '×', '÷'].includes(lastToken)) {
                // Pop the operator
                calcState.expression.pop();
                
                // Load the preceding operand if it exists
                if (calcState.expression.length > 0) {
                    const prevToken = calcState.expression[calcState.expression.length - 1];
                    if (!isNaN(parseFloat(prevToken)) && isFinite(prevToken)) {
                        calcState.currentValue = calcState.expression.pop();
                        calcState.shouldResetInput = false;
                        calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
                    } else {
                        calcState.currentValue = '0';
                        calcState.shouldResetInput = true;
                        calcCurrent.textContent = '0';
                    }
                } else {
                    calcState.currentValue = '0';
                    calcState.shouldResetInput = false;
                    calcCurrent.textContent = '0';
                }
            } else if (lastToken === '(') {
                // Pop open bracket
                calcState.expression.pop();
                
                if (calcState.expression.length > 0) {
                    const prevToken = calcState.expression[calcState.expression.length - 1];
                    if (['+', '−', '×', '÷'].includes(prevToken)) {
                        calcState.shouldResetInput = true;
                    } else if (!isNaN(parseFloat(prevToken)) && isFinite(prevToken)) {
                        if (prevToken === '×' && calcState.expression.length > 1) {
                            const tokenBeforeMul = calcState.expression[calcState.expression.length - 2];
                            if (!isNaN(parseFloat(tokenBeforeMul)) && isFinite(tokenBeforeMul)) {
                                calcState.expression.pop(); // Pop '×'
                                calcState.currentValue = calcState.expression.pop(); // Pop number
                                calcState.shouldResetInput = false;
                                calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
                            }
                        }
                    }
                } else {
                    calcState.currentValue = '0';
                    calcState.shouldResetInput = false;
                    calcCurrent.textContent = '0';
                }
            } else if (lastToken === ')') {
                // Pop close bracket
                calcState.expression.pop();
                
                if (calcState.expression.length > 0) {
                    const prevToken = calcState.expression[calcState.expression.length - 1];
                    if (!isNaN(parseFloat(prevToken)) && isFinite(prevToken)) {
                        calcState.currentValue = calcState.expression.pop();
                        calcState.shouldResetInput = false;
                        calcCurrent.textContent = formatDisplayNumber(calcState.currentValue);
                    }
                }
            }
            updateHistoryDisplay();
        }
    }

    // --- Parenthesis Handling Logic ---

    function insertOpenParenthesis() {
        const isShowingPreviousResult = calcHistory.textContent.includes('=');
        if (isShowingPreviousResult) {
            calcState.expression = [];
            calcState.currentValue = '0';
            calcState.shouldResetInput = false;
            calcHistory.innerHTML = '&nbsp;';
        }
        
        const isTypingNumber = (calcState.currentValue !== '0' && !calcState.shouldResetInput);
        let lastToken = null;
        if (isTypingNumber) {
            lastToken = 'NUMBER';
        } else if (calcState.expression.length > 0) {
            lastToken = calcState.expression[calcState.expression.length - 1];
        }
        
        if (lastToken === 'NUMBER') {
            calcState.expression.push(calcState.currentValue);
            calcState.expression.push('×');
            calcState.currentValue = '0';
            calcState.shouldResetInput = true;
        } else if (lastToken === ')') {
            calcState.expression.push('×');
        }
        
        calcState.expression.push('(');
        calcCurrent.textContent = '0';
        updateHistoryDisplay();
    }

    function insertCloseParenthesis() {
        const isShowingPreviousResult = calcHistory.textContent.includes('=');
        if (isShowingPreviousResult) return;
        
        let openCount = 0;
        let closeCount = 0;
        calcState.expression.forEach(t => {
            if (t === '(') openCount++;
            if (t === ')') closeCount++;
        });
        
        if (openCount > closeCount) {
            const isTypingNumber = (calcState.currentValue !== '0' && !calcState.shouldResetInput);
            if (isTypingNumber) {
                calcState.expression.push(calcState.currentValue);
                calcState.currentValue = '0';
                calcState.shouldResetInput = true;
            }
            calcState.expression.push(')');
            calcCurrent.textContent = '0';
            updateHistoryDisplay();
        }
    }

    function handleParenthesis() {
        let openCount = 0;
        let closeCount = 0;
        calcState.expression.forEach(t => {
            if (t === '(') openCount++;
            if (t === ')') closeCount++;
        });
        
        let lastToken = null;
        const isTypingNumber = (calcState.currentValue !== '0' && !calcState.shouldResetInput);
        if (isTypingNumber) {
            lastToken = 'NUMBER';
        } else if (calcState.expression.length > 0) {
            lastToken = calcState.expression[calcState.expression.length - 1];
        }
        
        if (openCount > closeCount && (lastToken === 'NUMBER' || lastToken === ')')) {
            insertCloseParenthesis();
        } else {
            insertOpenParenthesis();
        }
    }

    // --- Converter Setup & Math ---

    function initConverterUnits() {
        const cat = converterCategory.value;
        const catData = converterState.units[cat];
        
        converterFromUnit.innerHTML = '';
        converterToUnit.innerHTML = '';
        
        catData.unitsList.forEach(u => {
            const optFrom = document.createElement('option');
            optFrom.value = u.value;
            optFrom.textContent = u.label;
            if (u.value === catData.defaultFrom) optFrom.selected = true;
            converterFromUnit.appendChild(optFrom);

            const optTo = document.createElement('option');
            optTo.value = u.value;
            optTo.textContent = u.label;
            if (u.value === catData.defaultTo) optTo.selected = true;
            converterToUnit.appendChild(optTo);
        });

        converterState.fromValue = '0';
        converterState.toValue = '0';
        converterFromValue.textContent = '0';
        converterToValue.textContent = '0';
        
        setActiveConverterField('from');
        
        const signEl = document.getElementById('key-sign');
        if (signEl) {
            if (cat === 'temperature') {
                signEl.classList.remove('disabled-btn');
            } else {
                signEl.classList.add('disabled-btn');
            }
        }
        
        // Sync custom dropdown displays
        syncCustomDropdown('select-from-unit');
        syncCustomDropdown('select-to-unit');
    }

    function setActiveConverterField(field) {
        converterState.activeField = field;
        if (field === 'from') {
            converterFromContainer.classList.add('active');
            converterToContainer.classList.remove('active');
        } else {
            converterToContainer.classList.add('active');
            converterFromContainer.classList.remove('active');
        }
    }

    converterFromContainer.addEventListener('click', () => {
        setActiveConverterField('from');
    });

    converterToContainer.addEventListener('click', () => {
        setActiveConverterField('to');
    });

    converterCategory.addEventListener('change', () => {
        initConverterUnits();
        syncCustomDropdown('select-category');
    });

    converterFromUnit.addEventListener('change', () => {
        performConversion();
        syncCustomDropdown('select-from-unit');
    });
    converterToUnit.addEventListener('change', () => {
        performConversion();
        syncCustomDropdown('select-to-unit');
    });

    function formatConverterDisplay(numStr) {
        if (numStr === '0' || numStr === '') return '0';
        if (numStr === '-') return '-';
        if (numStr.endsWith('.')) {
            return parseFloat(numStr).toLocaleString('en-US') + '.';
        }
        if (numStr.includes('.')) {
            const parts = numStr.split('.');
            const integerPart = parseFloat(parts[0]).toLocaleString('en-US');
            return integerPart + '.' + parts[1];
        }
        return parseFloat(numStr).toLocaleString('en-US', { maximumFractionDigits: 6 });
    }

    function performConversion() {
        const cat = converterCategory.value;
        const fromUnitVal = converterFromUnit.value;
        const toUnitVal = converterToUnit.value;
        
        if (cat === 'temperature') {
            let inputVal, resultVal;
            if (converterState.activeField === 'from') {
                inputVal = parseFloat(converterState.fromValue);
                if (isNaN(inputVal)) return;
                
                resultVal = convertTemperature(inputVal, fromUnitVal, toUnitVal);
                converterState.toValue = parseFloat(resultVal.toFixed(6)).toString();
                converterToValue.textContent = formatConverterDisplay(converterState.toValue);
            } else {
                inputVal = parseFloat(converterState.toValue);
                if (isNaN(inputVal)) return;
                
                resultVal = convertTemperature(inputVal, toUnitVal, fromUnitVal);
                converterState.fromValue = parseFloat(resultVal.toFixed(6)).toString();
                converterFromValue.textContent = formatConverterDisplay(converterState.fromValue);
            }
        } else {
            const catData = converterState.units[cat];
            const fromUnitObj = catData.unitsList.find(u => u.value === fromUnitVal);
            const toUnitObj = catData.unitsList.find(u => u.value === toUnitVal);
            
            if (!fromUnitObj || !toUnitObj) return;

            let inputVal, resultVal;
            if (converterState.activeField === 'from') {
                inputVal = parseFloat(converterState.fromValue);
                if (isNaN(inputVal)) return;
                
                const baseVal = inputVal * fromUnitObj.ratio;
                resultVal = baseVal / toUnitObj.ratio;
                
                converterState.toValue = parseFloat(resultVal.toFixed(8)).toString();
                converterToValue.textContent = formatConverterDisplay(converterState.toValue);
            } else {
                inputVal = parseFloat(converterState.toValue);
                if (isNaN(inputVal)) return;
                
                const baseVal = inputVal * toUnitObj.ratio;
                resultVal = baseVal / fromUnitObj.ratio;
                
                converterState.fromValue = parseFloat(resultVal.toFixed(8)).toString();
                converterFromValue.textContent = formatConverterDisplay(converterState.fromValue);
            }
        }
    }

    function convertTemperature(value, from, to) {
        if (from === to) return value;
        
        let celsius;
        if (from === 'C') {
            celsius = value;
        } else if (from === 'F') {
            celsius = (value - 32) * 5 / 9;
        } else if (from === 'K') {
            celsius = value - 273.15;
        }

        if (to === 'C') {
            return celsius;
        } else if (to === 'F') {
            return (celsius * 9 / 5) + 32;
        } else if (to === 'K') {
            return celsius + 273.15;
        }
        return value;
    }

    function handleConverterNumber(num) {
        let activeValue = converterState.activeField === 'from' ? converterState.fromValue : converterState.toValue;
        
        if (activeValue === '0') {
            activeValue = num;
        } else {
            if (activeValue.replace(/[.,-]/g, '').length < 12) {
                activeValue += num;
            }
        }

        if (converterState.activeField === 'from') {
            converterState.fromValue = activeValue;
            converterFromValue.textContent = formatConverterDisplay(activeValue);
        } else {
            converterState.toValue = activeValue;
            converterToValue.textContent = formatConverterDisplay(activeValue);
        }
        performConversion();
    }

    function handleConverterDecimal() {
        let activeValue = converterState.activeField === 'from' ? converterState.fromValue : converterState.toValue;
        
        if (!activeValue.includes('.')) {
            activeValue += '.';
        }

        if (converterState.activeField === 'from') {
            converterState.fromValue = activeValue;
            converterFromValue.textContent = formatConverterDisplay(activeValue);
        } else {
            converterState.toValue = activeValue;
            converterToValue.textContent = formatConverterDisplay(activeValue);
        }
    }

    function handleConverterBackspace() {
        let activeValue = converterState.activeField === 'from' ? converterState.fromValue : converterState.toValue;
        
        if (activeValue.length > 1) {
            activeValue = activeValue.slice(0, -1);
            if (activeValue === '-') activeValue = '0';
        } else {
            activeValue = '0';
        }

        if (converterState.activeField === 'from') {
            converterState.fromValue = activeValue;
            converterFromValue.textContent = formatConverterDisplay(activeValue);
        } else {
            converterState.toValue = activeValue;
            converterToValue.textContent = formatConverterDisplay(activeValue);
        }
        performConversion();
    }

    // --- Keypad Buttons Event Handlers ---
    const keypad = document.querySelector('.keypad-grid');
    keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.key-btn');
        if (!btn || btn.classList.contains('disabled-btn')) return;
        
        if (currentTab === 'calculator') {
            if (btn.dataset.number !== undefined) {
                handleNumber(btn.dataset.number);
            } else if (btn.dataset.key === 'decimal') {
                handleDecimal();
            } else if (btn.dataset.operator !== undefined) {
                handleOperator(btn.dataset.operator);
            } else if (btn.dataset.key === 'equals') {
                handleEquals();
            } else if (btn.dataset.key === 'clear') {
                handleClear();
            } else if (btn.dataset.key === 'toggle-sign') {
                handleToggleSign();
            } else if (btn.dataset.key === 'percent') {
                handlePercent();
            } else if (btn.dataset.key === 'parenthesis') {
                handleParenthesis();
            }
        } 
        else {
            if (btn.dataset.number !== undefined) {
                handleConverterNumber(btn.dataset.number);
            } else if (btn.dataset.key === 'decimal') {
                handleConverterDecimal();
            } else if (btn.dataset.key === 'clear') {
                handleClear();
            } else if (btn.dataset.key === 'toggle-sign') {
                handleToggleSign();
            }
        }
    });

    // --- Keyboard Event Handler ---
    document.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'SELECT') {
            return;
        }

        const key = e.key;
        
        if (currentTab === 'calculator') {
            if (/[0-9]/.test(key)) {
                handleNumber(key);
            } else if (key === '.') {
                handleDecimal();
            } else if (key === '+') {
                handleOperator('add');
            } else if (key === '-') {
                handleOperator('subtract');
            } else if (key === '*' || key === 'x' || key === 'X') {
                handleOperator('multiply');
            } else if (key === '/') {
                handleOperator('divide');
            } else if (key === '(') {
                insertOpenParenthesis();
            } else if (key === ')') {
                insertCloseParenthesis();
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                handleEquals();
            } else if (key === 'Escape' || key === 'c' || key === 'C') {
                handleClear();
            } else if (key === '%') {
                handlePercent();
            } else if (key === 'Backspace') {
                handleBackspace();
            }
        } 
        else {
            if (/[0-9]/.test(key)) {
                handleConverterNumber(key);
            } else if (key === '.') {
                handleConverterDecimal();
            } else if (key === 'Escape' || key === 'c' || key === 'C') {
                handleClear();
            } else if (key === 'Backspace') {
                handleConverterBackspace();
            }
        }
    });

    // --- Custom Glassomorphic Select Logic ---
    function syncCustomDropdown(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const select = container.querySelector('select');
        const triggerLabel = container.querySelector('.trigger-label');
        const dropdown = container.querySelector('.select-dropdown');
        
        if (!select || !triggerLabel || !dropdown) return;
        
        // Update label text
        const selectedOption = select.options[select.selectedIndex];
        triggerLabel.textContent = selectedOption ? selectedOption.text : '-';
        
        // Regenerate custom options
        dropdown.innerHTML = '';
        Array.from(select.options).forEach((opt, idx) => {
            const item = document.createElement('div');
            item.className = 'select-option' + (opt.selected ? ' selected' : '');
            item.textContent = opt.text;
            item.dataset.value = opt.value;
            
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                select.selectedIndex = idx;
                select.dispatchEvent(new Event('change'));
                container.classList.remove('open');
            });
            dropdown.appendChild(item);
        });
    }

    function setupCustomSelectEvents() {
        const customSelects = document.querySelectorAll('.custom-select');
        customSelects.forEach(cSelect => {
            const trigger = cSelect.querySelector('.select-trigger');
            if (!trigger) return;
            
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Toggle open on clicked select, close others
                const isOpen = cSelect.classList.contains('open');
                customSelects.forEach(other => other.classList.remove('open'));
                
                if (!isOpen) {
                    cSelect.classList.add('open');
                }
            });
        });
        
        // Close all when clicking anywhere else
        document.addEventListener('click', () => {
            customSelects.forEach(cSelect => cSelect.classList.remove('open'));
        });
    }

    // Initialize custom dropdowns
    setupCustomSelectEvents();
    syncCustomDropdown('select-category');
    syncCustomDropdown('select-from-unit');
    syncCustomDropdown('select-to-unit');
});
