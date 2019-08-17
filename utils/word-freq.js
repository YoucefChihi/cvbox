/**
 * 
 *	This function takes a list of words and a specified text and returns the frequency of each word.  
 *	The program processes in timed chunks as to not lock the browser up
 *
 *	@param {Array} words This is the list of words to match against
 *	@param {String} text This is the text to match
 *	@param {Function} This is the callback function
 *
 * TODO:
 * 	- option to halt if over certain amount of time
 *
 **/

module.exports = function textSearch(words, text, onComplete) {
	// console.log('textSearch', words)
	var regexString = null,
		regexs = [],
		keys = [],
		regs = [],
		wordCnt = {},
		words_len = words.length - 1,
		keys_len = 0;
	
	/**
	 *
	 * This function takes a function and processes it at a predefined interval until 
	 * all items are processed.  Once complete, a callback function is called.
	 * 
	 * @param {Function} func The function to process
	 * @param {int} total The total number of items
	 * @param {Function} callback The function that executes when the total reaches 0
	 *
	 */
	function timedChunk(func, total, callback) {
	    (function() {
	        var s = new Date().getTime();
			if (total <= 0) {
				return callback();
			}

			while (~total) {
				func(total);

				if ((new Date().getTime() - s) > 100) {
					setTimeout(arguments.callee, 25);
				}

				total--;
			}

			arguments.callee();
	    })();
	}
	
	/**
	 * 
	 */
	function findMatchTotals() {

		return timedChunk(function(len) {
			//if (~text.indexOf(keys[len])) {
			//if (regexs[len].test(text)) {
			if (text.search(keys[len])) {
				matches = text.match(regexs[len]);
				
				if (matches) {
					wordCnt[keys[len]] = matches.length;
				}
				//wordCnt[keys[len]] = text.match(keys[len]).length;				
			}
		}, keys_len, function() {
			return onComplete(wordCnt);
		});
	}

	// start the processing...
	return timedChunk(function(len) {
		var pattern = words[len].replace(" ", "\\s");
		keys.push(words[len]);
		regs.push(pattern);
		regexs.push(RegExp(pattern,"ig"));
		wordCnt[words[len]] = 0;
	}, words_len, function() {
		var regexString = RegExp(regs.join("|"), "i");		
		keys_len = keys.length - 1;
		var x = (regexString.test(text))
		? findMatchTotals()
		: null
		return findMatchTotals();
	});
}

// example of use
//  // Words to find
// var words = ["health", "sports"];

// // Text to search
// var text_to_search = document.body.innerHTML;

// // Function to call once work is complete
// var callback = function(output) {
// 	window.finalCount = output;
// 	console.log(finalCount);
// };

// textSearch(words, text_to_search, callback);