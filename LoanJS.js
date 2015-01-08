/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {
  module.exports = {
    Loan: require('./lib/loan').Loan,
    LoanScheduleDates: require('./lib/loan').LoanScheduleDates,
    moment: require('./lib/loan').moment,
    BestLoan: require('./lib/bestLoan'),
    loanToHtmlTable: require('./lib/loanToHtmlTable'),
  };
}());

