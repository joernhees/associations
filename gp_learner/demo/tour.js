var DemoTour;

{
    let DEMO_SEARCH_TERM = 'Dog';
    let DEMO_SEARCH_URI = 'http://dbpedia.org/resource/Dog';
    let DEMO_EXPLAIN_RESULT_TERM = 'Grape';
    let DEMO_EXPLAIN_RESULT_URI = 'http://dbpedia.org/resource/Grape';
    let demoSearchInterval;
    let $search = $('#stimulusForm').find('input[type=text]');
    let filterButtonSelector = '#fusedPredictionContent .table tr td:has(a[href="'+
        DEMO_EXPLAIN_RESULT_URI+'"]) ~ td button.filter';
    // ouch, I think my eyes just started bleeding

    let forceShowUnfilteredPatterns = function () {
        return new Promise((resolve, reject) => {
            let $tabLink = $('#graphPatternsTabLink');
            unset_gp_highlights();
            let handler = function (event) {
                $tabLink.off('shown.bs.tab', handler);
                resolve();
            };
            if ($tabLink.parent().hasClass('active')) {
                resolve();
            } else {
                $tabLink
                    .on('shown.bs.tab', handler)
                    .tab('show');
            }
        });
    };

    let forceExampleLoaded = function() {
        if ($search.text() != DEMO_SEARCH_URI) {
            return new Promise((resolve, reject) => {
                    predict(DEMO_SEARCH_URI, function () {
                        $search.val(DEMO_SEARCH_URI);
                        resolve();
                    })
                });
        } else {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
    };

    let forceShowFusedResults = function() {
        return new Promise((resolve, reject) => {
            let $tabLink = $('#fusedPredictionTabLink');
            forceExampleLoaded().then(() => {
                let handler = function (event) {
                    $tabLink.off('shown.bs.tab', handler);
                    resolve();
                };
                if ($tabLink.parent().hasClass('active')) {
                    resolve();
                } else {
                    $tabLink
                        .on('shown.bs.tab', handler)
                        .tab('show');
                }
            });
        });
    };

    let forceShowExplanation = function() {
        return new Promise((resolve, reject) => {
            let $tabLink = $('#graphPatternsTabLink');
            forceExampleLoaded().then(() => {
                let handler = function (event) {
                    $tabLink.off('shown.bs.tab', handler);
                    resolve();
                };
                if ($tabLink.parent().hasClass('active')) {
                    $(filterButtonSelector).click();
                    resolve();
                } else {
                    $tabLink
                        .on('shown.bs.tab', handler)
                        .tab('show');
                    $(filterButtonSelector).click();
                }
            });
        });
    };

    DemoTour = new Tour({
        debug: true,
        steps: [
            {
                element: '#graphPatternContentPanel',
                title: 'The learned patterns',
                content: 'Here you can see all patterns learned and used for ' +
                         'prediction. We\'ll come back to that later.',
                onShow: function (tour) {
                    return forceShowUnfilteredPatterns();
                }
            },
            {
                element: '#stimulusForm',
                title: 'Do Search',
                content: DEMO_SEARCH_TERM,
                placement: 'top',
                onShown: function (tour) {
                    let typeStep = 0;
                    demoSearchInterval = window.setInterval(function () {
                        if(typeStep == 0){
                            $search.focus();
                        }
                        if (typeStep < DEMO_SEARCH_TERM.length) {
                            $search.val($search.val()+DEMO_SEARCH_TERM[typeStep]);
                            $search.typeahead('lookup');
                        } else if (typeStep == DEMO_SEARCH_TERM.length) {
                            $search.focus();
                            $search.val(DEMO_SEARCH_TERM);
                            $search.typeahead('lookup');
                        }
                        typeStep++;
                    }, 200);
                },
                onHide: function (tour) {
                    window.clearInterval(demoSearchInterval);
                },
                onNext: function (tour) {
                    $search.val(DEMO_SEARCH_TERM);
                },
                onPrev: function (tour) {
                    $search.val('');
                }
            },
            {
                element: '.typeahead.dropdown-menu li:first',
                title: 'Click one',
                content: 'Woof!',
                placement: 'top',
                backdrop: false, // backdrop and dropdown does not work together
                onShow: function (tour) {
                    const promise = new Promise((resolve, reject) => {
                        let autocompleteDoneHandler = function () {
                            $search.off('autocomplete.done', autocompleteDoneHandler);
                            resolve();
                        };
                        $search.on('autocomplete.done', autocompleteDoneHandler);
                    });
                    $search.focus();
                    $search.val(DEMO_SEARCH_TERM);
                    $search.typeahead('lookup');
                    return promise
                },
                onShown: function (tour) {
                    $search.typeahead('lookup');
                },
            },
            {
                element: '#fusionDropdownButton',
                title: 'Choose a fusion method',
                content: 'Each graph pattern results in an unranked list of ' +
                         'candidates. Several methods to fuse them are available.',
                onShow: function (tour) {
                    $('.popover.tour-tour').find('.popover-title').text('Please wait');
                    $('.popover.tour-tour').find('.popover-content').text('loading');
                    return forceShowFusedResults();
                }
            },
            {
                element: '#fusedPredictionContent .table',
                title: 'TODO: explain table',
                content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut metus ullamcorper, venenatis quam id, iaculis libero. Mauris scelerisque dui gravida rutrum fermentum. Aenean nec eleifend nisi.',
                onShow: function (tour) {
                    return forceShowFusedResults();
                }
            },
            {
                element: filterButtonSelector,
                title: 'Get explanations of predictions',
                content: 'One might wonder why the algorithm lists '+
                         '&ldquo;'+DEMO_EXPLAIN_RESULT_TERM+'&rdquo; as associated with '+
                         '&ldquo;'+DEMO_SEARCH_TERM+'&rdquo;. Click here to see.',
                onShow: function () {
                    return forceShowFusedResults();
                },
            },
            {
                element: '#btnFilterToggle',
                title: 'See the contributing patterns',
                content: 'The patterns are automatically filtered. Only those '+
                         'that contribute to &ldquo;'+DEMO_SEARCH_TERM+'&rdquo; &ndash; '+
                         '&ldquo;'+DEMO_EXPLAIN_RESULT_TERM+'&rdquo; are shown.',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            },
            {
                element: '#gp1',
                title: 'TODO: explain the pattern list',
                content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut metus ullamcorper, venenatis quam id, iaculis libero. Mauris scelerisque dui gravida rutrum fermentum. Aenean nec eleifend nisi.',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            }

        ],
        backdrop: true,
        backdropPadding: 5,
    });

    // Initialize the tour
    DemoTour.init();

    $(function () {
        $('#start-tour').click(function () {
            DemoTour.restart();
        })
    });
}
