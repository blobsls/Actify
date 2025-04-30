// err.js

import buildError from './err.jsx';

throw buildError({ message: "Invalid user input", code: "ERR_INPUT" });
