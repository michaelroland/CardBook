Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource:///modules/mailServices.js");
Components.utils.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this,
                                  "LDAPAbCardFormatter",
                                  "resource://cardbook-modules/formatter.jsm");

const ACR = Components.interfaces.nsIAutoCompleteResult;

function cardbookAutocompleteResult(aSearchString) {
    this._searchResults = [];
    this.searchString = aSearchString;
}

cardbookAutocompleteResult.prototype = {
    _searchResults: null,
    _sortUsePopularity: false,

    searchString: null,
    searchResult: ACR.RESULT_NOMATCH,
    defaultIndex: -1,
    errorDescription: null,

    get matchCount() {
        return this._searchResults.length;
    },

    getValueAt: function getValueAt(aIndex) {
        return this._searchResults[aIndex].value;
    },

    getLabelAt: function getLabelAt(aIndex) {
        return this.getValueAt(aIndex);
    },

    getCommentAt: function getCommentAt(aIndex) {
        return this._searchResults[aIndex].comment;
    },

    getStyleAt: function getStyleAt(aIndex) {
        return this._searchResults[aIndex].style;
        // return "local-abook";
    },

    getImageAt: function getImageAt(aIndex) {
        return "";
    },

    getFinalCompleteValueAt: function(aIndex) {
    	return this.getValueAt(aIndex);
    },

    removeValueAt: function removeValueAt(aRowIndex, aRemoveFromDB) {
    },

    getCardAt: function getCardAt(aIndex) {
        return this._searchResults[aIndex].card;
    },

    getEmailToUse: function getEmailToUse(aIndex) {
        return this._searchResults[aIndex].emailToUse;
    },

    /* nsISupports */
    QueryInterface: XPCOMUtils.generateQI([ACR])
};

function cardbookAutocompleteSearch() {
    Services.obs.addObserver(this, "quit-application", false);
    this.searchTimeout = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
}

cardbookAutocompleteSearch.prototype = {

	ABInclRestrictions: {},
	ABExclRestrictions: {},
	catInclRestrictions: {},
	catExclRestrictions: {},
    LDAPContexts: {},
    searchListener: null,
    searchResult: null,
    searchTimeout: null,
	
    insertResultSorted: function insertResultSorted(aResult, aResultEntry) {
        if (aResult._searchResults.length === 0) {
            aResult._searchResults.push(aResultEntry);
        } else {
            var done = 0;
            for (var i = aResult._searchResults.length - 1 ; i >= 0; i--) {
                if (aResult._sortUsePopularity) {
                    if (Number(aResultEntry.popularity) < Number(aResult._searchResults[i].popularity)) {
                        aResult._searchResults.splice(i+1, 0, aResultEntry);
                        done = 1;
                        break;
                    } else if (Number(aResultEntry.popularity) === Number(aResult._searchResults[i].popularity) &&
                               aResultEntry.value.toLocaleLowerCase() > aResult._searchResults[i].value.toLocaleLowerCase()) {
                        aResult._searchResults.splice(i+1, 0, aResultEntry);
                        done = 1;
                        break;
                    }
                } else {
                    if (aResultEntry.value.toLocaleLowerCase() > aResult._searchResults[i].value.toLocaleLowerCase()) {
                        aResult._searchResults.splice(i+1, 0, aResultEntry);
                        done = 1;
                        break;
                    }
                }
            }
            if (done === 0) {
                aResult._searchResults.splice(0, 0, aResultEntry);
            }
        }
    },
    
    addResult: function addResult(aResult, aEmailValue, aComment, aPopularity, aDebugMode, aStyle) {
		if (aEmailValue != null && aEmailValue !== undefined && aEmailValue != "") {
			// check duplicate email
            var lcEmailValue = aEmailValue.toLocaleLowerCase();
			for (var i = 0; i < aResult._searchResults.length; i++) {
				if (aResult._searchResults[i].value.toLocaleLowerCase() == lcEmailValue) {
                    if (aResult._sortUsePopularity) {
                        if (aPopularity != null && aPopularity !== undefined && aPopularity != "") {
                            if (Number(aResult._searchResults[i].popularity) < Number(aPopularity)) {
                                var oldResult = aResult._searchResults[i];
                                oldResult.popularity = aPopularity;
                                aResult._searchResults.splice(i, 1);
                                this.insertResultSorted(aResult, oldResult);
                            }
                        }
                    }
					return;
				}
			}

			// add result
			var myPopularity = 0;
            if (aResult._sortUsePopularity) {
                if (aPopularity != null && aPopularity !== undefined && aPopularity != "") {
                    myPopularity = aPopularity;
                } else {
                    var addresses = {}, names = {}, fullAddresses = {};
                    MailServices.headerParser.parseHeadersWithArray(aEmailValue, addresses, names, fullAddresses);
                    var myTmpPopularity = 0;
                    for (var i = 0; i < addresses.value.length; i++) {
                        if (addresses.value[i] == "") {
                            continue;
                        }
                        if (cardbookRepository.cardbookMailPopularityIndex[addresses.value[i].toLowerCase()]) {
                            myTmpPopularity = cardbookRepository.cardbookMailPopularityIndex[addresses.value[i].toLowerCase()];
                            if (myPopularity === 0) {
                                myPopularity = myTmpPopularity;
                            }
                        } else {
                            continue;
                        }
                        if (myPopularity > myTmpPopularity) {
                            myPopularity = myTmpPopularity;
                        }
                    }
                }
            }
            
            var myComment = "";
            if (aComment != null && aComment !== undefined) {
                myComment = aComment;
            }
			if (aDebugMode) {
				myComment += " [" + myPopularity + "]";
			}

            this.insertResultSorted(aResult, {
                    value: aEmailValue,
                    comment: myComment,
                    card: null,
                    isPrimaryEmail: true,
                    emailToUse: aEmailValue,
                    popularity: myPopularity,
                    style: aStyle
            });
		}
    },

	loadRestrictions: function (aMsgIdentity) {
		var cardbookPrefService = new cardbookPreferenceService();
		var result = [];
		result = cardbookPrefService.getAllRestrictions();
		this.ABInclRestrictions = {};
		this.ABExclRestrictions = {};
		this.catInclRestrictions = {};
		this.catExclRestrictions = {};
		if (aMsgIdentity == "") {
			this.ABInclRestrictions["length"] = 0;
			return;
		}
		for (var i = 0; i < result.length; i++) {
			var resultArray = result[i].split("::");
			if ((resultArray[0] == "true") && ((resultArray[2] == aMsgIdentity) || (resultArray[2] == "allMailAccounts"))) {
				if (resultArray[1] == "include") {
					this.ABInclRestrictions[resultArray[3]] = 1;
					if (resultArray[4] && resultArray[4] != null && resultArray[4] !== undefined && resultArray[4] != "") {
						if (!(this.catInclRestrictions[resultArray[3]])) {
							this.catInclRestrictions[resultArray[3]] = {};
						}
						this.catInclRestrictions[resultArray[3]][resultArray[4]] = 1;
					}
				} else {
					if (resultArray[4] && resultArray[4] != null && resultArray[4] !== undefined && resultArray[4] != "") {
						if (!(this.catExclRestrictions[resultArray[3]])) {
							this.catExclRestrictions[resultArray[3]] = {};
						}
						this.catExclRestrictions[resultArray[3]][resultArray[4]] = 1;
					} else {
						this.ABExclRestrictions[resultArray[3]] = 1;
					}
				}
			}
		}
		this.ABInclRestrictions["length"] = cardbookUtils.sumElements(this.ABInclRestrictions);
	},
	
    /**
     * Starts a search based on the given parameters.
     *
     * @see nsIAutoCompleteSearch for parameter details.
     *
     * It is expected that aSearchParam contains the identity (if any) to use
     * for determining if an address book should be autocompleted against.
     *
     * aPreviousResult not used because always empty
     * popularity not used because not found how to set
     */
    startSearch: function startSearch(aSearchString, aSearchParam, aPreviousResult, aListener) {
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
		var result = new cardbookAutocompleteResult(aSearchString);
		result.fireOnce = 0;
		var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
		loader.loadSubScript("chrome://cardbook/content/wdw_log.js");
		loader.loadSubScript("chrome://cardbook/content/cardbookUtils.js");
		loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
		
		// If the search string isn't value, or contains a comma, or the user
		// hasn't enabled autocomplete, then just return no matches / or the
		// result ignored.
		// The comma check is so that we don't autocomplete against the user
		// entering multiple addresses.
		if (!aSearchString || /,/.test(aSearchString)) {
			result.searchResult = ACR.RESULT_IGNORED;
			aListener.onSearchResult(this, result);
			return;
		}

        this.stopSearch();
        
		aSearchString = aSearchString.replace(/[\s+\-+\.+\,+\;+]/g, "").toUpperCase();

		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var debugMode = prefs.getBoolPref("extensions.cardbook.debugMode");
		result._sortUsePopularity = prefs.getBoolPref("extensions.cardbook.autocompleteSortByPopularity");
        var showAddressbookComments = prefs.getBoolPref("extensions.cardbook.autocompleteShowAddressbookComments");

		var mySearchParamObj = JSON.parse(aSearchParam);
		this.loadRestrictions(mySearchParamObj.idKey);
		
		if (prefs.getBoolPref("extensions.cardbook.autocompletion")) {
			// add Cards
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && cardbookRepository.cardbookAccounts[i][6] != "SEARCH") {
					var myDirPrefId = cardbookRepository.cardbookAccounts[i][4];
					if (cardbookRepository.verifyABRestrictions(myDirPrefId, "allAddressBooks", this.ABExclRestrictions, this.ABInclRestrictions)) {
						var myStyle = cardbookRepository.getIconType(cardbookRepository.cardbookAccounts[i][6]) + " color_" + myDirPrefId;
                        var myComment = null;
                        if (showAddressbookComments) {
                            // display addressbook name in the comments column
                            myComment = cardbookRepository.cardbookAccounts[i][0];
                        }
						for (var j in cardbookRepository.cardbookCardSearch[myDirPrefId]) {
							if (j.indexOf(aSearchString) >= 0 || aSearchString == "") {
								for (var k = 0; k < cardbookRepository.cardbookCardSearch[myDirPrefId][j].length; k++) {
									var myCard = cardbookRepository.cardbookCardSearch[myDirPrefId][j][k];
									if (this.catExclRestrictions[myDirPrefId]) {
										var add = true;
										for (var l in this.catExclRestrictions[myDirPrefId]) {
											if (cardbookUtils.contains(myCard.categories, l)) {
												add = false;
												break;
											}
										}
										if (!add) {
											continue;
										}
									}
									if (this.catInclRestrictions[myDirPrefId]) {
										var add = false;
										for (var l in this.catInclRestrictions[myDirPrefId]) {
											if (cardbookUtils.contains(myCard.categories, l)) {
												add = true;
												break;
											}
										}
										if (!add) {
											continue;
										}
									}
									for (var l = 0; l < myCard.email.length; l++) {
										var myCurrentEmail = MailServices.headerParser.makeMimeAddress(myCard.fn, myCard.email[l][0][0]);
										this.addResult(result, myCurrentEmail, myComment, null, debugMode, myStyle);
									}
									// add Lists
									if (myCard.isAList) {
										this.addResult(result, myCard.fn + " <" + myCard.fn + ">", myComment, null, debugMode, myStyle);
									} else {
										this.addResult(result, cardbookUtils.getMimeEmailsFromCards([myCard]).join(" , "), myComment, null, debugMode, myStyle);
									}
								}
							}
						}
					}
				}
			}
			
			// add Categories
			for (var dirPrefId in cardbookRepository.cardbookAccountsCategories) {
				if (cardbookRepository.verifyABRestrictions(dirPrefId, "allAddressBooks", this.ABExclRestrictions, this.ABInclRestrictions)) {
					var cardbookPrefService = new cardbookPreferenceService(dirPrefId);
					var myStyle = cardbookRepository.getIconType(cardbookPrefService.getType()) + " color_" + dirPrefId;
					for (var i = 0; i < cardbookRepository.cardbookAccountsCategories[dirPrefId].length; i++) {
						var myCategory = cardbookRepository.cardbookAccountsCategories[dirPrefId][i];
						if (((!(this.catInclRestrictions[dirPrefId])) && (myCategory != cardbookRepository.cardbookUncategorizedCards)) ||
								((this.catInclRestrictions[dirPrefId]) && (this.catInclRestrictions[dirPrefId][myCategory]))) {
							if (myCategory.replace(/[\s+\-+\.+\,+\;+]/g, "").toUpperCase().indexOf(aSearchString) >= 0) {
								if (this.catExclRestrictions[myDirPrefId]) {
									var add = true;
									for (var l in this.catExclRestrictions[myDirPrefId]) {
										if (cardbookUtils.contains(myCard.categories, l)) {
											add = false;
											break;
										}
									}
									if (!add) {
										continue;
									}
								}
								var myCardList = [] ;
								for (var j = 0; j < cardbookRepository.cardbookDisplayCards[dirPrefId+"::"+myCategory].length; j++) {
									var myCard = cardbookRepository.cardbookDisplayCards[dirPrefId+"::"+myCategory][j];
									myCardList.push(myCard);
								}
								this.addResult(result, cardbookUtils.getMimeEmailsFromCards(myCardList).join(" , "), null, null, debugMode, myStyle);
							}
						}
					}
				}
			}
		}

        var performLDAPSearch = false;
        var ldapSearchURIs = [];
        
		// add Thunderbird standard emails
		if (!prefs.getBoolPref("extensions.cardbook.exclusive")) {
			var contactManager = Components.classes["@mozilla.org/abmanager;1"].getService(Components.interfaces.nsIAbManager);
			var contacts = contactManager.directories;
			var myStyle = "standard-abook";
			while ( contacts.hasMoreElements() ) {
				var contact = contacts.getNext().QueryInterface(Components.interfaces.nsIAbDirectory);
				if (cardbookRepository.verifyABRestrictions(contact.dirPrefId, "allAddressBooks", this.ABExclRestrictions, this.ABInclRestrictions)) {
                    if (contact.isRemote && contact.dirType === 0) {
                        // remote LDAP directory
                        ldapSearchURIs.push({
                                name: contact.dirName,
                                uri: contact.URI
                        });
                        performLDAPSearch = true;
                    } else {
                        var myComment = null;
                        if (showAddressbookComments) {
                            // display addressbook name in the comments column
                            myComment = contact.dirName;
                        }
                        var abCardsEnumerator = contact.childCards;
                        while (abCardsEnumerator.hasMoreElements()) {
                            var myABCard = abCardsEnumerator.getNext();
                            myABCard = myABCard.QueryInterface(Components.interfaces.nsIAbCard);
                            var myPrimaryEmail = myABCard.getProperty("PrimaryEmail","");
                            var myDisplayName = myABCard.getProperty("DisplayName","");
                            if (!myABCard.isMailList) {
                                if (myPrimaryEmail != "") {
                                    var lSearchString = myABCard.getProperty("FirstName","") + myABCard.getProperty("LastName","") + myDisplayName + myABCard.getProperty("NickName","") + myPrimaryEmail;
                                    lSearchString = lSearchString.replace(/[\s+\-+\.+\,+\;+]/g, "").toUpperCase();
                                    if (lSearchString.indexOf(aSearchString) >= 0) {
                                        if (myDisplayName == "") {
                                            var delim = myPrimaryEmail.indexOf("@",0);
                                            myDisplayName = myPrimaryEmail.substr(0,delim);
                                        }
                                        var myPopularity = myABCard.getProperty("PopularityIndex", "0");
                                        this.addResult(result,  MailServices.headerParser.makeMimeAddress(myDisplayName, myPrimaryEmail), myComment, myPopularity, debugMode, myStyle);
                                    }
                                }
                            } else {
                                var myABList = contactManager.getDirectory(myABCard.mailListURI);
                                var lSearchString = myDisplayName + myABList.listNickName + myABList.description;
                                lSearchString = lSearchString.replace(/[\s+\-+\.+\,+\;+]/g, "").toUpperCase();
                                if (lSearchString.indexOf(aSearchString) >= 0) {
                                    var myPopularity = myABCard.getProperty("PopularityIndex", "0");
                                    this.addResult(result,  MailServices.headerParser.makeMimeAddress(myDisplayName, myDisplayName), myComment, myPopularity, debugMode, myStyle);
                                }
                            }
                        }
                    }
				}
			}
		}

        if (performLDAPSearch) {
            var myStyle = "remote"; //"standard-abook";
            this.searchListener = aListener;
            this.searchResult = result;
            this.searchTimeout.init(this, 60000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
            ldapSearchURIs.forEach(function(aDirEntry) {
                this.startSearchFor(aSearchString, aDirEntry, myStyle);
            }, this);
        } else {
            // since there is no pending LDAP search we can immediately return results
            if (result.matchCount) {
                result.searchResult = ACR.RESULT_SUCCESS;
                result.defaultIndex = 0;
            }

            aListener.onSearchResult(this, result);
        }
    },

    startSearchFor: function startSearchFor(aSearchString, aDirEntry, aStyle) {
        try {
            var uri = aDirEntry.uri;
            var context;
            if (uri in this.LDAPContexts) {
                context = this.LDAPContexts[uri];
            } else {
                context = {};
                
                var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
                context.debugMode = prefs.getBoolPref("extensions.cardbook.debugMode");
                
                context.style = aStyle;
                context.showAddressbookComments = prefs.getBoolPref("extensions.cardbook.autocompleteShowAddressbookComments");
                
                context.bookName = aDirEntry.name;
                context.book = MailServices.ab.getDirectory(uri).QueryInterface(Components.interfaces.nsIAbLDAPDirectory);
                
                context.numQueries = 0;
                context.query = Components.classes["@mozilla.org/addressbook/ldap-directory-query;1"]
                        .createInstance(Components.interfaces.nsIAbDirectoryQuery);
                context.attributes = Components.classes["@mozilla.org/addressbook/ldap-attribute-map;1"]
                        .createInstance(Components.interfaces.nsIAbLDAPAttributeMap);
                context.attributes.setAttributeList("DisplayName", context.book.attributeMap.getAttributeList("DisplayName", {}), true);
                context.attributes.setAttributeList("PrimaryEmail", context.book.attributeMap.getAttributeList("PrimaryEmail", {}), true);
                LDAPAbCardFormatter.requiredPropertiesFromBook(context.book).forEach(function(aProperty) {
                    var alreadyMapped = context.attributes.getAttributeList(aProperty);
                    if (alreadyMapped) {
                        return;
                    }
                    context.attributes.setAttributeList(aProperty, context.book.attributeMap.getAttributeList(aProperty, {}), true);
                }, this);
                
                context.listener = {
                    // nsIAbDirSearchListener
                    
                    onSearchFinished: (function onSearchFinished(aResult, aErrorMsg) {
                        context.numQueries--;
                        if (!context || context.stopped || context.numQueries > 0) {
                            return;
                        }

                        context.finished = true;
                        context.result = aResult;
                        context.errorMsg = aErrorMsg;

                        if (Object.keys(this.LDAPContexts).some(function(aURI) {
                                return !this.LDAPContexts[aURI].finished;
                            }, this)) {
                            return;
                        }

                        return this.onSearchFinished(aResult, aErrorMsg, context);
                    }).bind(this),
                    
                    onSearchFoundCard: (function onSearchFoundCard(aCard) {
                        if (!context || context.stopped) {
                            return;
                        }
                        return this.onSearchFoundCard(aCard, context);
                    }).bind(this)
                };
                
                this.LDAPContexts[uri] = context;
            }

            let args = Components.classes["@mozilla.org/addressbook/directory/query-arguments;1"]
                    .createInstance(Components.interfaces.nsIAbDirectoryQueryArguments);

            let filterTemplate = context.book.getStringValue("autoComplete.filterTemplate", "");
            if (!filterTemplate) {
                filterTemplate = "(|(cn=%v1*%v2-*)(mail=%v1*%v2-*)(sn=%v1*%v2-*))";
            }

            let ldapSvc = Components.classes["@mozilla.org/network/ldap-service;1"]
                    .getService(Components.interfaces.nsILDAPService);
            let filter = ldapSvc.createFilter(1024, filterTemplate, "", "", "", aSearchString);
            if (!filter) {
                throw new Error("Filter string is empty, check if filterTemplate variable is valid in prefs.js.");
            }
            args.typeSpecificArg = context.attributes;
            args.querySubDirectories = true;
            args.filter = filter;

            context.finished = false;
            context.stopped = false;
            context.result = null;
            context.errorMsg = null;
            context.numQueries++;
            context.contextId = context.query.doQuery(context.book, args, context.listener, context.book.maxHits, 0);
        } catch(error) {
            Components.utils.reportError(error);
            throw error;
        }
    },
    
    stopSearch: function stopSearch() {
        if (this.searchListener) {
            Object.keys(this.LDAPContexts).forEach(function(aURI) {
                var context = this.LDAPContexts[aURI];
                if (context && !context.stopped && !context.finished) {
                    if (context.query) {
                        context.query.stopQuery(context.contextId);
                    }
                    context.stopped = true;
                }
            }, this);
            this.searchListener = null;
            this.searchResult = null;
        }
    },

    onSearchFinished: function onSearchFinished(aResult, aErrorMsg, aContext) {
        if (!this.searchListener) {
            return;
        }

        if (aResult == Components.interfaces.nsIAbDirectoryQueryResultListener.queryResultError) {
            this.searchResult.searchResult = ACR.RESULT_FAILURE;
            this.searchResult.defaultIndex = 0;
        }
        
        if (this.searchResult.matchCount > 0) {
            // treat as success if there are matches, regardless of LDAP errors
            this.searchResult.searchResult = ACR.RESULT_SUCCESS;
            this.searchResult.defaultIndex = 0;
        } else {
            if (aResult == Components.interfaces.nsIAbDirectoryQueryResultListener.queryResultComplete) {
                // LDAP completed but there were no matches (neither from LDAP nor from other address books)
                this.searchResult.searchResult = ACR.RESULT_NOMATCH;
            }
        }
        
        this.searchListener.onSearchResult(this, this.searchResult);
        this.searchListener = null;
        this.searchResult = null;
    },

    onSearchFoundCard: function onSearchFoundCard(aCard, aContext) {
        if (!this.searchListener) {
            return;
        }

        var myComment = null;
        if (aContext.showAddressbookComments) {
            myComment = LDAPAbCardFormatter.commentFromCard(aCard, aContext.book, aContext.bookName);
        }
        this.addResult(this.searchResult, MailServices.headerParser.makeMimeAddress(aCard.displayName, aCard.primaryEmail), myComment, 0, aContext.debugMode, aContext.style);
    },
  
    // nsIObserver
    
    observe: function observer(subject, topic, data) {
        if (topic == "quit-application") {
            Services.obs.removeObserver(this, "quit-application");
        } else if (topic != "timer-callback") {
            return;
        }

        this.stopSearch();
        // free resources once we reached the timeout
        Object.keys(this.LDAPContexts).forEach(function(aURI) {
            var context = this.LDAPContexts[aURI];
            context.book = null;
            context.query = null;
            context.attributes = null;
            context.result = null;
            context.errorMsg = null;
            delete this.LDAPContexts[aURI];
        }, this);
        this.LDAPContexts = {};
    },
    
    // nsIClassInfo
    
    getInterfaces: function(aCount) {
        let ifaces = [ Components.interfaces.nsIAutoCompleteSearch,
                       Components.interfaces.nsIObserver,
                       Components.interfaces.nsIClassInfo,
                       Components.interfaces.nsISupports ];
        aCount.value = ifaces.length;

        return ifaces;
    },

    getHelperForLanguage: function(language) {
        return null;
    },

    contractID: "@mozilla.org/autocomplete/search;1?name=addrbook-cardbook",
    classDescription: "Class description",
    classID: Components.ID("{0DE07280-EE68-11E4-B66F-4AD01D5D46B0}"),
    implementationLanguage: Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT,
    flags: 0,

    // nsISupports

    QueryInterface: function(aIID) {
        if (!aIID.equals(Components.interfaces.nsIAutoCompleteSearch)
            && !aIID.equals(Components.interfaces.nsIObserver)
            && !aIID.equals(Components.interfaces.nsIClassInfo)
            && !aIID.equals(Components.interfaces.nsISupports))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    }
};

/** Module Registration */
function NSGetFactory(cid) {
	return (XPCOMUtils.generateNSGetFactory([cardbookAutocompleteSearch]))(cid);
}
