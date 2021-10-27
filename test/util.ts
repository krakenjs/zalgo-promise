export {};

// @ts-ignore - karma on console
window.console.karma = (...args) => {
    // @ts-ignore karma on window
    const karma = window.karma || (window.top && window.top.karma) || (window.opener && window.opener.karma);
    karma.log('debug', args);
    // eslint-disable-next-line no-console, @typescript-eslint/no-unsafe-argument
    console.log(...args);
};