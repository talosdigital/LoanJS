/*
 * LoanJS
 * Calculating loan in equal or diminishing installments
 * https://github.com/kfiku/LoanJS
 *
 * Copyright (c) 2014 Grzegorz Klimek
 * Licensed under the MIT license.
 */

(function() {
  var moment = require('moment');
  // moment('2015/01/03','YYYY/MM/DD').isSaturday() => true
  moment.fn.isSaturday = function() {
    return this.day() === 6;
  };

  // moment('2015/01/04','YYYY/MM/DD').isSaturday() => false
  moment.fn.isSunday = function() {
    return this.day() === 0;
  };

  moment.fn.isWorkingDay = function() {
    return !(this.isSunday() || this.isSaturday() || this.isHolyday());
  };

  moment.fn.findNextWorkingDate = function() {
    var nextDay = this.clone().add(1, 'days');
    if (nextDay.isWorkingDay()){
      return nextDay;
    }else{
      return nextDay.findNextWorkingDate();
    }
  };

  // Based on from https://gist.github.com/jrhames/5200024
  // moment('12/25/2013', 'MM/DD/YYYY').holiday()

  moment.fn.isHolyday = function() {
    var holidays = getHolydays();
    var diff = 1+ (0 | (this._d.getDate() - 1) / 7),
        memorial = (this._d.getDay() === 1 && (this._d.getDate() + 7) > 30) ? "5" : null;

    return (holidays.M[this.format('MM/DD')] || holidays.W[this.format('M/'+ (memorial || diff) +'/d')]) !== undefined;
  };
/**
 * Create Loan Object with all instalments and sum of interest
 * @param {number} amount                   full amount of Loan
 * @param {number} installmentsNumber       how meny installments will be
 * @param {number} interestRate             interest rate in percent (3.5)
 * @param {[bool]} diminishingInstallments  if installments will be
 *                                          diminishing (true) or
 *                                          equal/annuity (false)
 *
 * @return {object} {
 *                    amount: 1000,
 *                    capitalSum: 999.96,
 *                    interestSum: 27.09
 *                    sum: 1027.09
 *                    installments: [
 *                      {
 *                        capital: 83.33,
 *                        installment: 87.5
 *                        intrest: 4.17
 *                        remain: 0
 *                      },
 *                      {...},
 *                      ...
 *                    ]
 *                  }
 */
var Loan = function (amount, installmentsNumber, interestRate, diminishing, periodDuration, periodType, fromDate) {
  'use strict';
  if(!amount || amount <= 0 ||
     !installmentsNumber || installmentsNumber <= 0 ||
     !interestRate || interestRate <= 0 ) {
    throw 'wrong parameters (' +
          [amount, installmentsNumber, interestRate, diminishing].join(', ') +
          ')';
  }

  if (!fromDate) {
    fromDate = moment();
  }

  var installments = [],
      interestSum = 0,
      capitalSum  = 0,
      sum         = 0,

      inst,

      // round helper function
      rnd = function (num) {
        return Math.round(num*100)/100;
      },

      getNextInstalment = function() {
        var capital,
            intrest,
            installment,
            irmPow,
            interestRateMonth = interestRate / 1200;

        if (diminishing) {
          capital = amount / installmentsNumber;
          intrest = (amount - capitalSum) * interestRateMonth;
          installment = rnd(capital + intrest);
        } else {
          irmPow = Math.pow(1 + interestRateMonth, installmentsNumber);
          installment = rnd(amount * ((interestRateMonth * irmPow) / (irmPow - 1)));
          intrest = rnd((amount - capitalSum) * interestRateMonth);
          capital = installment - intrest;
        }

        return {
          capital: rnd(capital),
          intrest: rnd(intrest),
          installment: installment,
          remain: rnd(amount - capitalSum - capital),
          interestSum: interestSum + intrest
        };
      };

  var paymentScheduleDates = LoanScheduleDates.getAllPaymentsDates(periodDuration, periodType, installmentsNumber);
  for (var i = 0; i < installmentsNumber; i++) {
    inst = getNextInstalment();
    inst.paymentDay = paymentScheduleDates[i].format(); // (ISO 8601)
    sum         += inst.installment;
    capitalSum  += inst.capital;
    interestSum += inst.intrest;
    // adding lost sum on rounding
    if(i === installmentsNumber - 1) {
      inst.installment += inst.remain;
      inst.capital += inst.remain;
      capitalSum += inst.remain;
      sum += inst.remain;
      sum = rnd(sum);
      inst.remain = 0;
    }

    installments.push(inst);
  }

  return {
    installments  : installments,
    amount        : rnd(amount),
    interestSum   : rnd(interestSum),
    capitalSum    : rnd(capitalSum),
    sum           : sum,
    state         : 'PENDING'
  };
};

var getHolydays = function () {
  return {
    'M': {//Month, Day
      '01/01': "New Year's Day",
      '07/04': "Independence Day",
      '11/11': "Veteran's Day",
      '11/28': "Thanksgiving Day",
      '11/29': "Day after Thanksgiving",
      '12/24': "Christmas Eve",
      '12/25': "Christmas Day",
      '12/31': "New Year's Eve"
    },
    'W': {//Month, Week of Month, Day of Week
      '1/3/1': "Martin Luther King Jr. Day",
      '2/3/1': "Washington's Birthday",
      '5/5/1': "Memorial Day",
      '9/1/1': "Labor Day",
      '10/2/1': "Columbus Day",
      '11/4/4': "Thanksgiving Day"
    }
  };
};

var LoanScheduleDates = {
  // calculate all payments dates based in period
  getAllPaymentsDates: function (fromDate, periodDuration, periodType, numberOfInstallments){

    // public variables

    // private vars
    var rawPaymentDates = [];
    // var currentDate = fromDate.clone().add(periodDuration, periodType);
    var currentDate;
    var nextWorkingDay;

    var periodIterator;

    for (periodIterator=0; periodIterator<numberOfInstallments; periodIterator++){

      if(!currentDate.isWorkingDay()){

        currentDate = currentDate.findNextWorkingDate();
        currentDate.hour(0).minute(0);

      }
      var nextPaymentDate = currentDate.clone().add(periodDuration * periodIterator, periodType);

      if (nextPaymentDate.isWorkingDay()){

        rawPaymentDates[periodIterator] = nextPaymentDate;
        // baseline date

      } else{

        nextWorkingDay = nextPaymentDate.findNextWorkingDate();
        nextWorkingDay.hour(0).minute(0);

        rawPaymentDates[periodIterator] = nextWorkingDay.clone();
        // baseline date

      }

    }

    return rawPaymentDates;

  }
};

if(typeof module === 'undefined') {
  // browser
  if(typeof LOANJS_NAMESPACE === 'object') {
    LOANJS_NAMESPACE.Loan = Loan;
  } else {
    if(!window.LoanJS) {
      window.LoanJS = {};
    }
    window.LoanJS.Loan = Loan;
  }
} else {
  // node or browserfy
  module.exports.Loan = Loan;
  module.exports.LoanScheduleDates = LoanScheduleDates;
  module.exports.moment = moment;
}

}());
