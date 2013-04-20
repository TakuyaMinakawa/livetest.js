var LIVETEST = window.LIVETEST || {};

LIVETEST.General = function () {
	this.testcases = {};
	this.tab = new LIVETEST.Tab();
	this.countPassingSpecs = 0;
	this.$countPassingSpecs = null;
	this.$body = $('body');
	this.$head = $('head');
	this.$panel = $(
		'<div id="jsi-live-test" style="display: none;">' +
		'	<div id="jsi-lt-tab">' +
		'		<table>' +
		'			<tr id="jsi-lt-tab-list">' +
		'			</tr>' +
		'		</table>' +
		'	</div>' +
		'	<div id="jsi-lt-outputs">' +
		'	</div>' +
		'	<div id="jsi-lt-footer">' +
		'		<table id="jsi-lt-status">' +
		'			<tr>' +
		'				<td id="jsi-lt-status-name">LIVETEST</td>' +
		'				<td id="jsi-lt-status-passing">' +
		'					Passing <span id="jsi-lt-status-count-spec">0</span> specs' +
		'				</td>' +
		'				<td id="jsi-lt-status-last"></td>' +
		'			</tr>' +
		'		</table>' +
		'		<p id="jsi-lt-footer-specs">' +
		'		</p>' +
		'	</div>' +
		'</div>'
	);

	this.init();
};
LIVETEST.General.PATH = {
	CSS: '/livetest.css'
};
LIVETEST.General.DURATION = {
	FADEIN_INIT: 300
};
LIVETEST.General.BASE_ELEMENTS = {
	$TEST_SECTION: $(
		'<tr>' +
		'	<th class="jsc-lt-op-spec">●</th>' +
		'	<td>' +
		'		<div class="jsc-lt-op-name"></div>' +
		'		<div class="jsc-lt-op-value"></div>' +
		'	</td>' +
		'</tr>'
	),
	$FOOTER_SPEC_CIRCLE: $(
		'<a hrev="javascript: void(0);">●</a>'
	)
};
LIVETEST.General.CLASS = {
	BOOL: {
		TRUE: 'jsc-lt-true',
		FALSE: 'jsc-lt-false'
	},
	OUTPUT: {
		BASE: 'jsc-lt-output',
		SPEC: 'jsc-lt-op-spec',
		NAME: 'jsc-lt-op-name',
		VALUE: 'jsc-lt-op-value',
		TABLE: 'jsc-lt-op-table'
	}
};
LIVETEST.General.REGEX = {
	COLOR_BOOL: /(true|false)/ig
};
LIVETEST.General.REPLACE = {
	COLOR_BOOL: '<span class="jsc-lt-$1">$1</span>'
};
LIVETEST.General.INTERVAL = 50;
LIVETEST.General.prototype = {
	init: function () {
		this.generatePanel();
		this.tab.getElements();
		this.readStyleSheetToFadeInPanel();
		this.startInterval();
	},
	generatePanel: function () {
		this.$body.append(this.$panel);
		this.$countPassingSpecs = $('#jsi-lt-status-count-spec');
	},
	readStyleSheetToFadeInPanel: function () {
		this.$head.append('<link rel="stylesheet" href="' + LIVETEST.General.PATH.CSS + '" />');

		// The timeout for read css delay.
		setTimeout($.proxy(function () {
			this.$panel.fadeIn(LIVETEST.General.DURATION.FADEIN_INIT);
		}, this), 0);
	},
	startInterval: function () {
		setInterval($.proxy(function () {
			this.runTest();
		}, this), LIVETEST.General.INTERVAL);
	},
	addTestcase: function (testcase) {
		var
			$tableOutput,
			$specFooter,
			nameTab = (testcase.nameTab) ? testcase.nameTab : LIVETEST.Tab.NAME.GENERAL,
			$testsection = LIVETEST.General.BASE_ELEMENTS.$TEST_SECTION.clone(),
			$specFooterCircle = LIVETEST.General.BASE_ELEMENTS.$FOOTER_SPEC_CIRCLE.clone(),
			$nameTest = $testsection.find('.' + LIVETEST.General.CLASS.OUTPUT.NAME),
			$valueTest = $testsection.find('.' + LIVETEST.General.CLASS.OUTPUT.VALUE);

		if (!testcase.nameTab) {
			testcase.nameTab = LIVETEST.Tab.NAME.GENERAL;
		}

		if (!this.testcases[testcase.nameTest]) {
			if (typeof this.tab.indexTabs[nameTab] === 'undefined') {
				// Nothing a tab.
				this.tab.add(nameTab);
			}

			$tableOutput = this.$panel.find('.' + LIVETEST.General.CLASS.OUTPUT.TABLE);
			$tableOutput = $tableOutput.eq(this.tab.indexTabs[nameTab]);

			$specFooter = this.tab.$specsFooter.find('.' + LIVETEST.Tab.CLASS.FOOTER_SPEC);
			$specFooter = $specFooter.eq(this.tab.indexTabs[nameTab]);

			$nameTest.text(testcase.nameTest);
			$tableOutput.append($testsection);
			$specFooter.append($specFooterCircle);

			this.runTest();

			this.testcases[testcase.nameTest] = testcase;
			this.testcases[testcase.nameTest].$specTest = $testsection.find('.' + LIVETEST.General.CLASS.OUTPUT.SPEC);
			this.testcases[testcase.nameTest].$nameTest = $nameTest;
			this.testcases[testcase.nameTest].$valueTest = $valueTest;
			this.testcases[testcase.nameTest].$specFooterCircle = $specFooterCircle;
		}
	},
	runTest: function () {
		var
			nameTest,
			resultOutput,
			testcaseTarget;

		this.countPassingSpecs = 0;

		for (nameTest in this.testcases) {
			testcaseTarget = this.testcases[nameTest];

			if (testcaseTarget.flgRanFirst && testcaseTarget.flgNoInterval) {
				continue;
			}

			if (this.tab.indexTabs[testcaseTarget.nameTab] !== this.tab.indexCurrent) {
				// Through the hidden tab.
				continue;
			}

			resultOutput = testcaseTarget.functionOutput();
			this.checkSpec(testcaseTarget);
			testcaseTarget.$valueTest
				.text(resultOutput);

			testcaseTarget.flgRanFirst = true;
		}

		this.$countPassingSpecs.text(this.countPassingSpecs);
		this.changeColorBoolean();
	},
	checkSpec: function (testcaseTarget) {
		testcaseTarget.$specTest.removeClass(LIVETEST.General.CLASS.BOOL.TRUE);
		testcaseTarget.$specTest.removeClass(LIVETEST.General.CLASS.BOOL.FALSE);
		testcaseTarget.$specFooterCircle.removeClass(LIVETEST.General.CLASS.BOOL.TRUE);
		testcaseTarget.$specFooterCircle.removeClass(LIVETEST.General.CLASS.BOOL.FALSE);

		if (typeof testcaseTarget.functionTest !== 'function') {
			return;
		}

		if (testcaseTarget.functionTest()) {
			testcaseTarget.$specTest.addClass(LIVETEST.General.CLASS.BOOL.TRUE);
			testcaseTarget.$specFooterCircle.addClass(LIVETEST.General.CLASS.BOOL.TRUE);
			this.countPassingSpecs++;
		} else {
			testcaseTarget.$specTest.addClass(LIVETEST.General.CLASS.BOOL.FALSE);
			testcaseTarget.$specFooterCircle.addClass(LIVETEST.General.CLASS.BOOL.FALSE);
		}
	},
	changeColorBoolean: function () {
		var
			$valueTest,
			valueColored,
			$valuesTest = this.$panel.find('.' + LIVETEST.General.CLASS.OUTPUT.VALUE);

		$valuesTest.each(function () {
			$valueTest = $(this);
			valueColored = $valueTest.text().replace(
				LIVETEST.General.REGEX.COLOR_BOOL,
				LIVETEST.General.REPLACE.COLOR_BOOL
			);

			$valueTest.html(valueColored);
		});
	}
};

LIVETEST.Tab = function () {
	this.indexCurrent = 0;
	this.indexTabs = {};
	this.$outputs = null;
	this.$linksInTab = null;
	this.$list = null;
	this.$specsFooter = null;
};
LIVETEST.Tab.NAME = {
	GENERAL: 'General'
};
LIVETEST.Tab.CLASS = {
	CURRENT: 'jsc-current',
	FOOTER_SPEC: 'jsc-lt-footer-spec'
};
LIVETEST.Tab.BASE_ELEMENTS = {
	$OUTPUT: $(
		'<div class="jsc-lt-output">' +
		'	<table class="jsc-lt-op-table">' +
		'	</table>' +
		'</div>'
	),
	$TAB: $(
		'<td>' +
		'	<a href="javascript: void(0);"></a>' +
		'</td>'
	),
	$FOOTER_SPEC: $(
		'<div class="jsc-lt-footer-spec">' +
		'</div>'
	)
};
LIVETEST.Tab.COUNT_FIRST_TAB = 1;
LIVETEST.Tab.prototype = {
	getElements: function () {
		this.$outputs = $('#jsi-lt-outputs');
		this.$list = $('#jsi-lt-tab-list');
		this.$specsFooter = $('#jsi-lt-footer-specs');
	},
	bindEvent: function () {
		var
			nameTab = '',
			_self = this;

		this.$linksInTab.off('click');
		this.$linksInTab.on('click', function () {
			nameTab = $(this).text();
			_self.change(nameTab, _self);
		});
	},
	add: function (nameTab) {
		var
			lengthTabs,
			$tabAdd = LIVETEST.Tab.BASE_ELEMENTS.$TAB.clone(),
			$linkAdd = $tabAdd.find('a'),
			$output = LIVETEST.Tab.BASE_ELEMENTS.$OUTPUT.clone(),
			$specFooter = LIVETEST.Tab.BASE_ELEMENTS.$FOOTER_SPEC.clone();

		this.$outputs.append($output);
		$linkAdd.text(nameTab);
		$tabAdd.append($linkAdd);
		this.$specsFooter.append($specFooter);

		lengthTabs = Object.keys(this.indexTabs).length;
		this.indexTabs[nameTab] = lengthTabs;

		this.$list.append($tabAdd);
		this.$linksInTab = this.$list.find('a');
		lengthTabs = Object.keys(this.indexTabs).length;

		if (lengthTabs === LIVETEST.Tab.COUNT_FIRST_TAB) {
			this.change(nameTab, this);
		}

		this.bindEvent();
	},
	change: function (nameTab, _self) {
		_self.indexCurrent = _self.indexTabs[nameTab];

		var
			$linkTarget = _self.$linksInTab.eq(_self.indexCurrent),
			$outputsChildren = _self.$outputs.find('.' + LIVETEST.General.CLASS.OUTPUT.BASE),
			$outputTarget = $outputsChildren.eq(_self.indexCurrent),
			$specsFooterChildren = _self.$specsFooter.find('.' + LIVETEST.Tab.CLASS.FOOTER_SPEC),
			$specFooterTarget = $specsFooterChildren.eq(_self.indexCurrent);

		if ($linkTarget.hasClass(LIVETEST.Tab.CLASS.CURRENT)) {
			return;
		}

		_self.$linksInTab.removeClass(LIVETEST.Tab.CLASS.CURRENT);
		$outputsChildren.removeClass(LIVETEST.Tab.CLASS.CURRENT);
		$specsFooterChildren.removeClass(LIVETEST.Tab.CLASS.CURRENT);

		$linkTarget.addClass(LIVETEST.Tab.CLASS.CURRENT);
		$outputTarget.addClass(LIVETEST.Tab.CLASS.CURRENT);
		$specFooterTarget.addClass(LIVETEST.Tab.CLASS.CURRENT);
	}
};

var liveTest;

if (typeof jQuery === 'function') {
	jQuery(function () {
		liveTest = new LIVETEST.General();

		// Default test
		liveTest.addTestcase({
			nameTest: 'window: width',
			functionOutput: function () {
				return $(window).width() + ' px';
			}
		});
		liveTest.addTestcase({
			nameTest: 'window: height',
			functionOutput: function () {
				return $(window).height() + ' px';
			}
		});
		liveTest.addTestcase({
			nameTest: 'window: scrollTop',
			functionOutput: function () {
				return $(window).scrollTop() + ' px';
			},
			functionTest: function () {
				return $(window).scrollTop() >= 100;
			}
		});
		liveTest.addTestcase({
			nameTest: 'window: scrollLeft',
			functionOutput: function () {
				return $(window).scrollLeft() + ' px';
			},
			functionTest: function () {
				return $(window).scrollLeft() >= 0;
			}
		});
		liveTest.addTestcase({
			nameTest: 'test',
			nameTab: 'test',
			functionOutput: function () {
				return 'true false trflafalse';
			}
		});
		liveTest.addTestcase({
			nameTest: 'test1',
			nameTab: 'test1',
			functionOutput: function () {
				return 'true false trflafalse';
			}
		});
		liveTest.addTestcase({
			nameTest: 'test2',
			nameTab: 'test1',
			functionOutput: function () {
				return 'true false trflafalse';
			}
		});
	});
} else {
	console.log('Please load jQuery');
}
