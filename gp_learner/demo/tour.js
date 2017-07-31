var DemoTour;

{
    let DEMO_SEARCH_TERM = 'Circus';
    let DEMO_SEARCH_URI = 'http://dbpedia.org/resource/Circus';
    let DEMO_EXPLAIN_RESULT_TERM = 'Juggling';
    let DEMO_EXPLAIN_RESULT_URI = 'http://dbpedia.org/resource/Juggling';
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
        if ($search.text() !== DEMO_SEARCH_URI) {
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
        backdrop: true,
        backdropPadding: 5,
        orphan: true,
        steps: [
            {
                title: 'Demo Tour',
                content: "With this quick walk-through we'll show you all components of this demo. Tipp: You can use the arrow keys on your keyboard <kbd><i class='fa fa-arrow-left'></i></kbd>,<kbd><i class='fa fa-arrow-right'></i></kbd>.",
            },
            {
                element: '#gp1',
                title: 'Learned patterns',
                placement: 'top',
                content: "Before starting any fancy prediction stuff, you can already explore the patterns learned during training time. These are the patterns that will be used to predict responses later in this demo.",
                onShow: function (tour) {
                    return forceShowUnfilteredPatterns();
                }
            },
            {
                element: '#gp1 .sparql',
                title: 'SPARQL',
                placement: 'top',
                content: "If you like, you can expand each pattern to see its SPARQL form. Each query contains at least one <code>?source</code> and <code>?target</code> variable. When entering a stimulus above, its semantic entity will be inserted in place of all <code>?source</code> variables in all of the GraphPatterns. Next, each SPARQL query will be executed and the <code>?target</code> variables selected (more on this later).",
                onShow: function (tour) {
                    $('#gp1 a.sparql').click();
                },
                onHidden: function () {
                    $('#gp1 a.sparql').click();
                }
            },
            {
                element: '#gp1 .info',
                title: 'Graph & Info',
                placement: 'top',
                content: 'Additionally you can view each pattern graphically and see its fitness information from training. For more information on this, please see <a href="https://w3id.org/associations/#paper_gplearner">the graph learner paper</a>.',
                onShow: function (tour) {
                    $('#gp1 a.info').click();
                },
                onHidden: function () {
                    $('#gp1 a.info').click();
                }
            },
            {
                element: '#gp1 a.targets',
                title: 'Targets',
                placement: 'top',
                content: 'Additionally you can view the pattern graphically and see its fitness information from training.',
                onShow: function (tour) {
                    $('#gp1 a.targets').click();
                }
            },
            {
                element: '#stimulusForm',
                title: 'Entering a stimulus',
                content: "Let's jump right in and enter a stimulus, e.g. " + DEMO_SEARCH_TERM,
                placement: 'top',
                onShown: function (tour) {
                    let typeStep = 0;
                    demoSearchInterval = window.setInterval(function () {
                        if(typeStep === 0){
                            $search.focus();
                        }
                        if (typeStep < DEMO_SEARCH_TERM.length) {
                            $search.val($search.val()+DEMO_SEARCH_TERM[typeStep]);
                            $search.typeahead('lookup');
                        } else if (typeStep === DEMO_SEARCH_TERM.length) {
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
                title: 'Entity disambiguation',
                content: "As you can see, your inputs are immediately disambiguated to a Wikipedia article, allowing you to pick a semantic entity easily. Pick the top one.",
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
                reflex: true,
            },
            {
                element: '#fusionDropdownButton',
                title: 'Choose a fusion method',
                content: 'Each graph pattern results in an unranked list of ' +
                         'candidates. Several methods to fuse them are available.',
                onShow: function (tour) {
                    let $tour = $('.popover.tour-tour');
                    $tour.find('.popover-title').text('Please wait');
                    $tour.find('.popover-content').text('loading');
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
    });

    // Initialize the tour
    DemoTour.init();

    $(function () {
        $('#start-tour').click(function () {
            DemoTour.restart();
        })
    });
}
