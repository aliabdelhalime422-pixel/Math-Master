import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type HistoryItem = {
  expression: string;
  result: string;
};

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [displayValue, setDisplayValue] = useState('0');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [justCalculated, setJustCalculated] = useState(false);
  const [waitingForNewNumber, setWaitingForNewNumber] = useState(false);

  // Evaluate the current expression safely
  const calculateResult = useCallback((expr: string) => {
    try {
      // Replace safe operators with JS operators
      let toEval = expr.replace(/×/g, '*').replace(/÷/g, '/');
      // Basic sanity check to avoid executing arbitrary JS
      if (/[^0-9+\-*/().%\s]/.test(toEval)) return null;
      
      // Handle trailing operators
      if (/[+\-*/.]$/.test(toEval.trim())) {
        toEval = toEval.trim().slice(0, -1);
      }

      if (!toEval) return null;

      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${toEval}`)();
      
      // Handle NaN and Infinity
      if (!Number.isFinite(result)) return 'Error';
      
      // Format number nicely (e.g. 0.1 + 0.2 = 0.3)
      return parseFloat(result.toFixed(10)).toString();
    } catch (e) {
      return 'Error';
    }
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (displayValue === 'Error') {
      if (key === 'AC') {
        setDisplayValue('0');
        setExpression('');
      }
      return;
    }

    if (/[0-9]/.test(key)) {
      if (justCalculated || waitingForNewNumber) {
        setDisplayValue(key);
        if (justCalculated) setExpression('');
        setJustCalculated(false);
        setWaitingForNewNumber(false);
      } else {
        setDisplayValue(prev => prev === '0' ? key : prev + key);
      }
    } else if (key === '.') {
      if (justCalculated || waitingForNewNumber) {
        setDisplayValue('0.');
        if (justCalculated) setExpression('');
        setJustCalculated(false);
        setWaitingForNewNumber(false);
      } else if (!displayValue.includes('.')) {
        setDisplayValue(prev => prev + '.');
      }
    } else if (['+', '-', '×', '÷'].includes(key)) {
      setJustCalculated(false);
      setWaitingForNewNumber(false);
      if (expression && (displayValue === '' || waitingForNewNumber)) {
        // Change the last operator
        setExpression(prev => prev.trim().slice(0, -1) + ' ' + key + ' ');
      } else {
        const result = calculateResult(expression + displayValue);
        const nextExpr = (justCalculated ? displayValue : expression + displayValue) + ' ' + key + ' ';
        setExpression(nextExpr);
        if (result && !justCalculated) setDisplayValue(result);
        setWaitingForNewNumber(true);
      }
    } else if (key === '=') {
      if (justCalculated || !expression) return;
      const fullExpr = expression + displayValue;
      const res = calculateResult(fullExpr);
      
      if (res) {
        setHistory(prev => [...prev.slice(-4), { expression: fullExpr, result: res }]);
        setDisplayValue(res);
        setExpression(fullExpr + ' =');
        setJustCalculated(true);
        setWaitingForNewNumber(false);
      }
    } else if (key === 'AC') {
      setDisplayValue('0');
      setExpression('');
      setJustCalculated(false);
      setWaitingForNewNumber(false);
    } else if (key === '⌫') {
      if (justCalculated || waitingForNewNumber) return;
      setDisplayValue(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '%') {
      const val = parseFloat(displayValue) / 100;
      setDisplayValue(val.toString());
      setWaitingForNewNumber(false);
    } else if (key === '+/-') {
      if (displayValue && displayValue !== '0') {
        setDisplayValue(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
      }
    }
  }, [displayValue, expression, justCalculated, waitingForNewNumber, calculateResult]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key;
      if (/[0-9.]/.test(key)) handleKeyPress(key);
      else if (key === '+') handleKeyPress('+');
      else if (key === '-') handleKeyPress('-');
      else if (key === '*' || key === 'x') handleKeyPress('×');
      else if (key === '/' || key === '÷') handleKeyPress('÷');
      else if (key === 'Enter' || key === '=') handleKeyPress('=');
      else if (key === 'Escape') handleKeyPress('AC');
      else if (key === 'Backspace') handleKeyPress('⌫');
      else if (key === '%') handleKeyPress('%');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const Button = ({ children, onClick, variant = 'default', className = '' }: any) => {
    const variants = {
      default: 'bg-[#2b2b2e] hover:bg-[#3a3a3d] text-[#f4f4f5]',
      operator: 'bg-[#f4a261] hover:bg-[#fb8500] text-black font-medium',
      action: 'bg-[#404043] hover:bg-[#505053] text-[#e4e4e7]',
      large: 'col-span-2 aspect-[2/1] rounded-3xl',
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(children)}
        className={`relative overflow-hidden text-xl sm:text-2xl flex items-center justify-center aspect-square rounded-full transition-colors shadow-sm
          ${variants[variant as keyof typeof variants]} ${className}`}
      >
        {children}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#111113] flex items-center justify-center p-4 font-sans text-foreground">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#f4a261]/10 to-transparent rounded-full blur-[100px] pointer-events-none opacity-50" />
      
      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full justify-center items-end md:items-start z-10">
        
        {/* Calculator Body */}
        <div className="bg-[#1c1c1e] p-6 rounded-[2.5rem] shadow-2xl border border-white/5 w-full max-w-[380px] shrink-0">
          
          {/* Display Area */}
          <div className="bg-[#151516] rounded-3xl p-6 mb-6 h-36 flex flex-col items-end justify-between shadow-inner border border-black/20">
            <div className="text-[#a1a1aa] font-mono text-sm tracking-wider h-6 overflow-hidden w-full text-right opacity-80">
              {expression}
            </div>
            <div className="font-mono text-4xl sm:text-5xl tracking-tight font-medium text-white truncate w-full text-right">
              {displayValue || '0'}
            </div>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            <Button onClick={handleKeyPress} variant="action">AC</Button>
            <Button onClick={handleKeyPress} variant="action">+/-</Button>
            <Button onClick={handleKeyPress} variant="action">%</Button>
            <Button onClick={handleKeyPress} variant="operator">÷</Button>

            <Button onClick={handleKeyPress}>7</Button>
            <Button onClick={handleKeyPress}>8</Button>
            <Button onClick={handleKeyPress}>9</Button>
            <Button onClick={handleKeyPress} variant="operator">×</Button>

            <Button onClick={handleKeyPress}>4</Button>
            <Button onClick={handleKeyPress}>5</Button>
            <Button onClick={handleKeyPress}>6</Button>
            <Button onClick={handleKeyPress} variant="operator">-</Button>

            <Button onClick={handleKeyPress}>1</Button>
            <Button onClick={handleKeyPress}>2</Button>
            <Button onClick={handleKeyPress}>3</Button>
            <Button onClick={handleKeyPress} variant="operator">+</Button>

            <Button onClick={handleKeyPress} variant="default" className="col-span-2 aspect-auto rounded-full justify-start pl-8">0</Button>
            <Button onClick={handleKeyPress}>.</Button>
            <Button onClick={handleKeyPress} variant="operator">=</Button>
          </div>
        </div>

        {/* History Sidebar */}
        <div className="w-full max-w-[380px] md:max-w-xs md:h-[600px] flex flex-col justify-end pb-8">
          <div className="px-4">
            <h3 className="text-[#a1a1aa] text-sm font-medium tracking-widest uppercase mb-4 opacity-50">History</h3>
            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {history.length === 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 0.5 }} 
                    className="text-[#a1a1aa] text-sm font-mono"
                  >
                    No recent calculations
                  </motion.p>
                )}
                {history.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    className="flex flex-col items-end border-b border-white/5 pb-3"
                  >
                    <div className="text-[#a1a1aa] font-mono text-sm mb-1">{item.expression}</div>
                    <div className="text-white font-mono text-xl">{item.result}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
