// supported formats :
// "YYYY-MM-DD"
// "YYYY.MM.DD"
// "YYYY/MM/DD"
// "DD-MM-YYYY"
// "DD.MM.YYYY"
// "DD/MM/YYYY"
// "MM-DD-YYYY"
// "MM.DD.YYYY"
// "MM/DD/YYYY"
// "YYYYMMDD"
// "DDMMYYYY"
// "MMDDYYYY"
if ("undefined" == typeof(cardbookDates)) {
	var cardbookDates = {
		
		getSeparator: function (aDateFormat) {
			switch(aDateFormat) {
				case "YYYY-MM-DD":
				case "DD-MM-YYYY":
				case "MM-DD-YYYY":
					var lSeparator = "-";
					break;
				case "YYYY.MM.DD":
				case "DD.MM.YYYY":
				case "MM.DD.YYYY":
					var lSeparator = ".";
					break;
				case "YYYY/MM/DD":
				case "DD/MM/YYYY":
				case "MM/DD/YYYY":
					var lSeparator = "/";
					break;
				default:
					var lSeparator = "";
			}
			return lSeparator;
		},

		verifyDateFields: function (aDateString, aDay, aMonth, aYear) {
			var lReturn;
			if (aDay == "" && aMonth == "") {
				lReturn = "WRONGDATE";
			} else {
				if (aDay <= 0 || aDay > 31) {
					lReturn = "WRONGDATE";
				} else if (aMonth <= 0 || aMonth > 12) {
					lReturn = "WRONGDATE";
				} else if (aYear <= 0 || aYear > 3000) {
					lReturn = "WRONGDATE";
				} else {
					try {
						lReturn = aDateString;
					}
					catch (e) {
						lReturn = "WRONGDATE";
					}
				}
			}
			return lReturn;
		},

		isDateStringCorrectlyFormatted: function (aDateString, aDateFormat) {
			var lSeparator = cardbookDates.getSeparator(aDateFormat);
			var lReturn;
			var lFirstField;
			var lSecondField;
			var lThirdField;
			if (aDateString.length < 3) {
				lReturn = "WRONGDATE";
			} else if (lSeparator != "" && aDateString.indexOf(lSeparator) == -1) {
				lReturn = "WRONGDATE";
			} else if (lSeparator == "" && (aDateString.indexOf("-") >= 0 || aDateString.indexOf(".") >= 0 || aDateString.indexOf("/") >= 0)) {
				lReturn = "WRONGDATE";
			} else {
				switch(aDateFormat) {
					case "YYYY-MM-DD":
					case "YYYY.MM.DD":
					case "YYYY/MM/DD":
						if (aDateString.split(lSeparator).length == 3) {
							var EmptyParamRegExp2 = new RegExp("^([^\-]*)\\" + lSeparator + "([^\-]*)\\" + lSeparator + "([^\-]*)", "ig");
							if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
								lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
								lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
								lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
								lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
							}
							lReturn = cardbookDates.verifyDateFields(aDateString, lThirdField, lSecondField, lFirstField);
						} else {
							var EmptyParamRegExp2 = new RegExp("^([^\-]*)\\" + lSeparator + "([^\-]*)", "ig");
							if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
								lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
								lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
								lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							}
							lReturn = cardbookDates.verifyDateFields(aDateString, lSecondField, lFirstField, '666');
						}
						break;
					case "DD-MM-YYYY":
					case "DD.MM.YYYY":
					case "DD/MM/YYYY":
						if (aDateString.split(lSeparator).length == 3) {
							var EmptyParamRegExp2 = new RegExp("^([^\.]*)\\" + lSeparator + "([^\.]*)\\" + lSeparator + "([^\.]*)", "ig");
							if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
								lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
								lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
								lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
								lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
							}
							lReturn = cardbookDates.verifyDateFields(aDateString, lFirstField, lSecondField, lThirdField);
						} else {
							var EmptyParamRegExp2 = new RegExp("^([^\.]*)\\" + lSeparator + "([^\.]*)", "ig");
							if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
								lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
								lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
								lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							}
							lReturn = cardbookDates.verifyDateFields(aDateString, lFirstField, lSecondField, '666');
						}
						break;
					case "MM-DD-YYYY":
					case "MM.DD.YYYY":
					case "MM/DD/YYYY":
						if (aDateString.split(lSeparator).length == 3) {
							var EmptyParamRegExp2 = new RegExp("^([^\/]*)\\" + lSeparator + "([^\/]*)\\" + lSeparator + "([^\/]*)", "ig");
							if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
								lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
								lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
								lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
								lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
							}
							lReturn = cardbookDates.verifyDateFields(aDateString, lSecondField, lFirstField, lThirdField);
						} else {
							var EmptyParamRegExp2 = new RegExp("^([^\/]*)\\" + lSeparator + "([^\/]*)", "ig");
							if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
								lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
								lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
								lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							}
							lReturn = cardbookDates.verifyDateFields(aDateString, lSecondField, lFirstField, '666');
						}
						break;
					case "YYYYMMDD":
						if (aDateString.length == 8) {
							lFirstField = aDateString.substr(0, 4);
							lSecondField = aDateString.substr(4, 2);
							lThirdField = aDateString.substr(6, 2);
							lReturn = cardbookDates.verifyDateFields(aDateString, lThirdField, lSecondField, lFirstField);
						} else if (aDateString.length == 4 || aDateString.length == 3) {
							lFirstField = aDateString.substr(0, 2);
							lSecondField = aDateString.substr(2, 2);
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							lReturn = cardbookDates.verifyDateFields(aDateString, lSecondField, lFirstField, '666');
						}
						break;
					case "DDMMYYYY":
						if (aDateString.length == 8) {
							lFirstField = aDateString.substr(0, 2);
							lSecondField = aDateString.substr(2, 2);
							lThirdField = aDateString.substr(4, 4);
							lReturn = cardbookDates.verifyDateFields(aDateString, lFirstField, lSecondField, lThirdField);
						} else if (aDateString.length == 4 || aDateString.length == 3) {
							lFirstField = aDateString.substr(0, 2);
							lSecondField = aDateString.substr(2, 2);
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							lReturn = cardbookDates.verifyDateFields(aDateString, lFirstField, lSecondField, '666');
						}
						break;
					case "MMDDYYYY":
						if (aDateString.length == 8) {
							lFirstField = aDateString.substr(0, 2);
							lSecondField = aDateString.substr(2, 2);
							lThirdField = aDateString.substr(4, 4);
							lReturn = cardbookDates.verifyDateFields(aDateString, lSecondField, lFirstField, lThirdField);
						} else if (aDateString.length == 4 || aDateString.length == 3) {
							lFirstField = aDateString.substr(0, 2);
							lSecondField = aDateString.substr(2, 2);
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							lReturn = cardbookDates.verifyDateFields(aDateString, lSecondField, lFirstField, '666');
						}
						break;
					default:
						lReturn = "WRONGDATE";
				}
			}
			return lReturn;
		},

		convertDateStringToDate: function (aDateString, aDateFormat) {
			var lSeparator = cardbookDates.getSeparator(aDateFormat);
			var lReturn;
			var lFirstField;
			var lSecondField;
			var lThirdField;
			switch(aDateFormat) {
				case "YYYY-MM-DD":
				case "YYYY.MM.DD":
				case "YYYY/MM/DD":
					if (aDateString.split(lSeparator).length == 3) {
						var EmptyParamRegExp2 = new RegExp("^([^\-]*)\\" + lSeparator + "([^\-]*)\\" + lSeparator + "([^\-]*)", "ig");
						if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
							lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
							lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
							lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
							lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
						}
						lReturn = new Date(lFirstField, lSecondField-1, lThirdField);
					} else {
						var EmptyParamRegExp2 = new RegExp("^([^\-]*)\\" + lSeparator + "([^\-]*)", "ig");
						if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
							lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
							lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
							lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
						}
						lReturn = new Date('666', lFirstField-1, lSecondField);
					}
					break;
				case "DD-MM-YYYY":
				case "DD.MM.YYYY":
				case "DD/MM/YYYY":
					if (aDateString.split(lSeparator).length == 3) {
						var EmptyParamRegExp2 = new RegExp("^([^\.]*)\\" + lSeparator + "([^\.]*)\\" + lSeparator + "([^\.]*)", "ig");
						if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
							lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
							lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
							lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
							lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
						}
						lReturn = new Date(lThirdField, lSecondField-1, lFirstField);
					} else {
						var EmptyParamRegExp2 = new RegExp("^([^\.]*)\\" + lSeparator + "([^\.]*)", "ig");
						if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
							lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
							lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
							lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
						}
						lReturn = new Date('666', lSecondField-1, lFirstField);
					}
					break;
				case "MM-DD-YYYY":
				case "MM.DD.YYYY":
				case "MM/DD/YYYY":
					if (aDateString.split(lSeparator).length == 3) {
						var EmptyParamRegExp2 = new RegExp("^([^\/]*)\\" + lSeparator + "([^\/]*)\\" + lSeparator + "([^\/]*)", "ig");
						if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
							lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
							lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
							lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
							lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
							lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
						}
						lReturn = new Date(lThirdField, lFirstField-1, lSecondField);
					} else {
						var EmptyParamRegExp2 = new RegExp("^([^\/]*)\\" + lSeparator + "([^\/]*)", "ig");
						if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
							lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
							lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
							lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
							lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
						}
						lReturn = new Date('666', lFirstField-1, lSecondField);
					}
					break;
				case "YYYYMMDD":
					if (aDateString.length == 8) {
						lFirstField = aDateString.substr(0, 4);
						lSecondField = aDateString.substr(4, 2);
						lThirdField = aDateString.substr(6, 2);
						lReturn = new Date(lFirstField, lSecondField-1, lThirdField);
					} else if (aDateString.length == 4 || aDateString.length == 3) {
						lFirstField = aDateString.substr(0, 2);
						lSecondField = aDateString.substr(2, 2);
						lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
						lReturn = new Date('666', lFirstField-1, lSecondField);
					}
					break;
				case "DDMMYYYY":
					if (aDateString.length == 8) {
						lFirstField = aDateString.substr(0, 2);
						lSecondField = aDateString.substr(2, 2);
						lThirdField = aDateString.substr(4, 4);
						lReturn = new Date(lThirdField, lSecondField-1, lFirstField);
					} else if (aDateString.length == 4 || aDateString.length == 3) {
						lFirstField = aDateString.substr(0, 2);
						lSecondField = aDateString.substr(2, 2);
						lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
						lReturn = new Date('666', lSecondField-1, lFirstField);
					}
					break;
				case "MMDDYYYY":
					if (aDateString.length == 8) {
						lFirstField = aDateString.substr(0, 2);
						lSecondField = aDateString.substr(2, 2);
						lThirdField = aDateString.substr(4, 4);
						lReturn = new Date(lThirdField, lFirstField-1, lSecondField);
					} else if (aDateString.length == 4 || aDateString.length == 3) {
						lFirstField = aDateString.substr(0, 2);
						lSecondField = aDateString.substr(2, 2);
						lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
						lReturn = new Date('666', lFirstField-1, lSecondField);
					}
					break;
				default:
					lReturn = "WRONGDATE";
			}
			return lReturn;
		},

		convertDateToDateString: function (aDate, aDateFormat) {
			var lSeparator = cardbookDates.getSeparator(aDateFormat);
			var lYear = aDate.getFullYear();
			var lMonth = aDate.getMonth() + 1;
			lMonth += "";
			if (lMonth.length == 1) {
				lMonth = "0"+lMonth;
			}
			var lDay = aDate.getDate();
			lDay += "";
			if (lDay.length == 1) {
				lDay = "0" + lDay;
			}
			switch(aDateFormat) {
				case "YYYY-MM-DD":
				case "YYYY.MM.DD":
				case "YYYY/MM/DD":
					lReturn = lYear + lSeparator + lMonth + lSeparator + lDay;
					break;
				case "DD-MM-YYYY":
				case "DD.MM.YYYY":
				case "DD/MM/YYYY":
					lReturn = lDay + lSeparator + lMonth + lSeparator + lYear;
					break;
				break;
				case "MM-DD-YYYY":
				case "MM.DD.YYYY":
				case "MM/DD/YYYY":
					lReturn = lMonth + lSeparator + lDay + lSeparator + lYear;
					break;
				case "YYYYMMDD":
					lReturn = lYear + lMonth + lDay;
					break;
				case "DDMMYYYY":
					lReturn = lDay + lMonth + lYear;
					break;
				case "MMDDYYYY":
					lReturn = lMonth + lDay + lYear;
					break;
			}
			return lReturn;
		}

	};
};