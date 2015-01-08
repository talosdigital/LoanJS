/*global describe,it*/
'use strict';
var assert  = require('assert'),
    Loan    = require('../LoanJS').Loan,
    moment    = require('../LoanJS').moment,
    loanScheduleDates    = require('../LoanJS').LoanScheduleDates;

describe('loanjs node module.', function() {
  it('must count loan correctly', function() {
    console.log(Loan);
    var loan = new Loan(100000, 20, 3.5, true, 1, 'days'),
        sum = 0,
        interestSum = 0;

    assert.ok(loan.installments.length === 20, true);
    for (var i = 0; i < loan.installments.length; i++) {
      var inst = loan.installments[i];
      assert.ok(inst.capital > 0, 'inst.capital shoult be > 0');
      assert.ok(inst.intrest > 0, 'inst.intrest shoult be > 0');
      assert.ok(inst.installment === inst.capital + inst.intrest, 'inst.installment shoult be sum of capital and intrest');

      sum += inst.installment;
      interestSum += inst.intrest;
    }

    assert.ok(loan.interestSum > 0, 'wrong interestSum');
    assert.equal(loan.capitalSum, 100000, 'wrong capitalSum');
    assert.equal(loan.interestSum, interestSum,
                'intrestsSum ('+loan.interestSum+') not exual to sum of all intrests ('+interestSum+') in instalments array');
    assert.equal(loan.sum, loan.interestSum + loan.capitalSum, true,
                'sum ('+loan.sum+') not equal to interestSum + capitalSum ('+(loan.interestSum + loan.capitalSum)+')');
    assert.equal(loan.sum, sum, true,
                'sum ('+loan.sum+') not exual to sum of all instalment ('+sum+') in instalments array');
  });
});

describe('Loan Payment Schedule Dates', function(){

  it('Dates should be Saturday', function(){
    assert.equal(true, moment('2015/01/03','YYYY/MM/DD').isSaturday(), '2015/01/03 is Saturday');
  });

  it('Dates should be Sunday', function(){
    assert.equal(true, moment('2015/01/04','YYYY/MM/DD').isSunday(), '2015/01/04 is Sunday');
  });

  it('Dates should be Holydays', function(){
    assert.equal(true, moment('12/25/2015', 'MM/DD/YYYY').isHolyday(), '12/25/2015 is a Holiday');
  });

  it('Dates should be Holydays', function(){
    assert.equal(false, moment('12/25/2015', 'MM/DD/YYYY').isWorkingDay(), '12/25/2015 is not a Working Day');
    assert.equal(false, moment('2015/01/04', 'YYYY/MM/DD').isWorkingDay(), '2015/01/04 is not a Working Day');
    assert.equal(false, moment('2015/01/03', 'YYYY/MM/DD').isWorkingDay(), '2015/01/03 is not a Working Day');
  });

  it('Should get six payment dates and all should be working dates', function(){

    var periodDuration = 2;
    var periodType = 'minutes';
    var numberOfInstallments = 6;
    var currentDate;
    var rawDates = loanScheduleDates.getAllPaymentsDates(periodDuration, periodType, numberOfInstallments);
    var nextDate;

    assert.strictEqual(rawDates.length, numberOfInstallments);

    var periodIterator;

    for(periodIterator=0; periodIterator<numberOfInstallments-1; periodIterator++){

      currentDate = moment(rawDates[periodIterator]);
      nextDate = moment(rawDates[periodIterator+1]);

      assert.equal(true, nextDate.subtract(periodDuration, periodType).isSame(currentDate));
      assert.equal(false, currentDate.subtract(periodDuration+1, periodType).isSame(rawDates[periodIterator]));
      assert.equal(false, currentDate.minutes() === nextDate.minutes());
    }

    periodDuration = 5;
    periodType = 'days';
    numberOfInstallments = 6;
    rawDates = loanScheduleDates.getAllPaymentsDates(periodDuration, periodType, numberOfInstallments);

    assert.strictEqual(rawDates.length, numberOfInstallments);

    for(periodIterator=0; periodIterator<numberOfInstallments-1; periodIterator++){

      currentDate = moment(rawDates[periodIterator]);
      nextDate = moment(rawDates[periodIterator+1]);
      assert.equal(true, currentDate.isWorkingDay());
      assert.equal(false, currentDate.date() === nextDate.date());
    }
  });


  it('Should get next working day', function(){

    var format = 'DD/MM/YYYY';
    var testDates = [
      {
        nonWorkingDay: '11/01/2015',
        workingDay: '12/01/2015'
       },
      {
        nonWorkingDay: '24/01/2015',
        workingDay: '26/01/2015'
       },
      {
        nonWorkingDay: '25/12/2015',
        workingDay: '28/12/2015'
       },
      {
        nonWorkingDay: '25/12/2014',
        workingDay: '26/12/2014'
       }
    ];

    var testIterator;
    for (testIterator=0; testIterator<testDates.length; testIterator++){

      var workingDay = moment(testDates[testIterator].workingDay, format).date();
      var nonWorkingDay = moment(testDates[testIterator].nonWorkingDay, format);
      var foundWorkingDay = nonWorkingDay.findNextWorkingDate().date();
      assert.equal(foundWorkingDay, workingDay);

    }

  });

});
