export {};

// @ts-ignore - karma on console
window.console.karma = (...args) => {
    // @ts-ignore karma on window
    const karma = window.karma || window.top && window.top.karma || window.opener && window.opener.karma; // eslint-disable-line no-mixed-operators
    karma.log('debug', args);
    // eslint-disable-next-line no-console
    console.log(...args);
};
