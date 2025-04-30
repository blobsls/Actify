/**
 * Actify Error Display System
 * Vanilla JS implementation for displaying errors in the Actify UI
 * @module Actify/ErrorDisplay
 * @version 1.0.0
 * @license MIT
 */

class ActifyErrorDisplay {
    constructor(options = {}) {
        this.options = {
            container: document.body,
            maxErrors: 5,
            autoDismiss: true,
            dismissTimeout: 8000,
            position: 'top-right',
            theme: 'dark',
            ...options
        };

        this.errorQueue = [];
        this.activeErrors = new Map();
        this.nextErrorId = 1;
        this.stylesInjected = false;

        this.init();
    }

    init() {
        this.injectStyles();
        this.createContainer();
    }

    injectStyles() {
        if (this.stylesInjected) return;

        const style = document.createElement('style');
        style.textContent = this.getStyleContent();
        document.head.appendChild(style);
        this.stylesInjected = true;
    }

    getStyleContent() {
        return `
            .actify-error-container {
                position: fixed;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
                pointer-events: none;
            }

            .actify-error-container.top-right {
                top: 20px;
                right: 20px;
                align-items: flex-end;
            }

            .actify-error-container.top-left {
                top: 20px;
                left: 20px;
                align-items: flex-start;
            }

            .actify-error-container.bottom-right {
                bottom: 20px;
                right: 20px;
                align-items: flex-end;
            }

            .actify-error-container.bottom-left {
                bottom: 20px;
                left: 20px;
                align-items: flex-start;
            }

            .actify-error {
                position: relative;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                pointer-events: auto;
                transform: translateY(-20px);
                opacity: 0;
                animation: actifyErrorEnter 0.3s ease-out forwards;
                max-width: 100%;
                box-sizing: border-box;
                overflow: hidden;
            }

            .actify-error.dark {
                background: #1e1e1e;
                color: #ffffff;
                border-left: 4px solid #ff4d4f;
            }

            .actify-error.light {
                background: #ffffff;
                color: #1e1e1e;
                border-left: 4px solid #ff4d4f;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .actify-error.warning {
                border-left-color: #faad14;
            }

            .actify-error.info {
                border-left-color: #1890ff;
            }

            .actify-error.critical {
                border-left-color: #f5222d;
                animation: actifyCriticalPulse 2s infinite;
            }

            .actify-error-title {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .actify-error-message {
                font-size: 14px;
                margin-bottom: 12px;
                line-height: 1.5;
            }

            .actify-error-details {
                font-size: 12px;
                color: inherit;
                opacity: 0.8;
                margin-bottom: 12px;
                white-space: pre-wrap;
                font-family: monospace;
                max-height: 200px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.1);
                padding: 8px;
                border-radius: 4px;
            }

            .actify-error-code {
                display: inline-block;
                background: rgba(0, 0, 0, 0.2);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
                margin-left: 8px;
            }

            .actify-error-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                font-size: 16px;
                opacity: 0.7;
                padding: 0 0 0 8px;
                transition: opacity 0.2s;
            }

            .actify-error-close:hover {
                opacity: 1;
            }

            .actify-error-footer {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                opacity: 0.7;
                margin-top: 8px;
            }

            .actify-error-expand {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                font-size: 12px;
                text-decoration: underline;
                padding: 0;
            }

            @keyframes actifyErrorEnter {
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes actifyCriticalPulse {
                0% { box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(245, 34, 45, 0); }
                100% { box-shadow: 0 0 0 0 rgba(245, 34, 45, 0); }
            }
        `;
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = `actify-error-container ${this.options.position}`;
        this.options.container.appendChild(this.container);
    }

    showError(error, options = {}) {
        const errorId = this.nextErrorId++;
        const errorObj = {
            id: errorId,
            error: error,
            options: {
                title: options.title || 'Error',
                type: options.type || 'error',
                details: options.details || null,
                code: options.code || null,
                timestamp: new Date(),
                source: options.source || 'application',
                metadata: options.metadata || {},
                dismissable: options.dismissable !== false
            }
        };

        this.errorQueue.push(errorObj);
        this.processQueue();

        return errorId;
    }

    processQueue() {
        while (this.errorQueue.length > 0 && this.activeErrors.size < this.options.maxErrors) {
            const errorObj = this.errorQueue.shift();
            this.displayError(errorObj);
        }
    }

    displayError(errorObj) {
        const errorElement = this.createErrorElement(errorObj);
        this.container.appendChild(errorElement);
        this.activeErrors.set(errorObj.id, errorElement);

        if (this.options.autoDismiss && errorObj.options.dismissable) {
            setTimeout(() => {
                this.dismissError(errorObj.id);
            }, this.options.dismissTimeout);
        }
    }

    createErrorElement(errorObj) {
        const errorEl = document.createElement('div');
        errorEl.className = `actify-error ${this.options.theme} ${errorObj.options.type}`;
        errorEl.dataset.errorId = errorObj.id;

        const titleEl = document.createElement('div');
        titleEl.className = 'actify-error-title';
        
        const titleText = document.createElement('span');
        titleText.textContent = errorObj.options.title;
        titleEl.appendChild(titleText);

        if (errorObj.options.code) {
            const codeEl = document.createElement('span');
            codeEl.className = 'actify-error-code';
            codeEl.textContent = errorObj.options.code;
            titleEl.appendChild(codeEl);
        }

        if (errorObj.options.dismissable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'actify-error-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => this.dismissError(errorObj.id));
            titleEl.appendChild(closeBtn);
        }

        errorEl.appendChild(titleEl);

        const messageEl = document.createElement('div');
        messageEl.className = 'actify-error-message';
        messageEl.textContent = errorObj.error instanceof Error ? errorObj.error.message : String(errorObj.error);
        errorEl.appendChild(messageEl);

        if (errorObj.options.details) {
            const detailsEl = document.createElement('div');
            detailsEl.className = 'actify-error-details';
            
            if (errorObj.error instanceof Error && errorObj.error.stack) {
                detailsEl.textContent = errorObj.error.stack;
            } else if (typeof errorObj.options.details === 'object') {
                detailsEl.textContent = JSON.stringify(errorObj.options.details, null, 2);
            } else {
                detailsEl.textContent = String(errorObj.options.details);
            }
            
            errorEl.appendChild(detailsEl);
        }

        const footerEl = document.createElement('div');
        footerEl.className = 'actify-error-footer';

        const timestampEl = document.createElement('span');
        timestampEl.textContent = errorObj.options.timestamp.toLocaleTimeString();
        footerEl.appendChild(timestampEl);

        const sourceEl = document.createElement('span');
        sourceEl.textContent = errorObj.options.source;
        footerEl.appendChild(sourceEl);

        errorEl.appendChild(footerEl);

        return errorEl;
    }

    dismissError(errorId) {
        const errorEl = this.activeErrors.get(errorId);
        if (!errorEl) return;

        errorEl.style.animation = 'none';
        errorEl.style.transform = 'translateY(0)';
        errorEl.style.opacity = '1';
        errorEl.style.transition = 'all 0.3s ease-out';

        setTimeout(() => {
            errorEl.style.transform = 'translateY(-20px)';
            errorEl.style.opacity = '0';
            
            setTimeout(() => {
                errorEl.remove();
                this.activeErrors.delete(errorId);
                this.processQueue();
            }, 300);
        }, 10);
    }

    clearAllErrors() {
        this.errorQueue = [];
        this.activeErrors.forEach((el, id) => this.dismissError(id));
    }

    handleSyntaxError(error) {
        const errorId = this.showError(error, {
            title: 'Syntax Error',
            type: 'critical',
            code: 'SYNTAX_ERROR',
            source: 'parser',
            details: {
                lineNumber: error.lineno,
                columnNumber: error.colno,
                fileName: error.filename
            }
        });
        return errorId;
    }

    handleRuntimeError(error) {
        const errorId = this.showError(error, {
            title: 'Runtime Error',
            type: 'error',
            code: 'RUNTIME_ERROR',
            source: 'application'
        });
        return errorId;
    }

    handleNetworkError(error) {
        const errorId = this.showError(error, {
            title: 'Network Error',
            type: 'error',
            code: 'NETWORK_ERROR',
            source: 'api',
            details: error.response || error.request || error.config
        });
        return errorId;
    }

    handleValidationError(error) {
        const errorId = this.showError(error, {
            title: 'Validation Error',
            type: 'warning',
            code: 'VALIDATION_ERROR',
            source: 'validation',
            details: error.details || error.errors
        });
        return errorId;
    }

    setupGlobalErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            if (event.error instanceof SyntaxError) {
                this.handleSyntaxError(event.error);
            } else {
                this.handleRuntimeError(event.error);
            }
            // Prevent default error handling (optional)
            // event.preventDefault();
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleRuntimeError(event.reason);
        });

        // Handle console errors (optional)
        const originalConsoleError = console.error;
        console.error = (...args) => {
            originalConsoleError.apply(console, args);
            const error = args.find(arg => arg instanceof Error) || args[0];
            this.showError(error, {
                title: 'Console Error',
                type: 'error',
                source: 'console'
            });
        };
    }
}

// Export the error display system
export default ActifyErrorDisplay;
