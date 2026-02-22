import { Buffer } from 'buffer';

// Essential polyfills for simple-peer in Vite environment
if (typeof window !== 'undefined') {
    // 1. Buffer
    window.Buffer = Buffer;
    
    // 2. global
    if (typeof window.global === 'undefined') {
        window.global = window;
    }
    
    // 3. process
    if (typeof window.process === 'undefined') {
        window.process = { 
            env: { DEBUG: undefined }, 
            nextTick: (cb) => setTimeout(cb, 0),
            version: '',
            browser: true
        };
    }
}
