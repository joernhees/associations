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
                } else {
                    $tabLink
                        .on('shown.bs.tab', handler)
                        .tab('show');
                    $(filterButtonSelector).click();
                }
                let collapsing = $('.collapsing[aria-expanded="true"]');
                if (collapsing.length) {
                    let todo = collapsing.length;
                    collapsing.each(function (idx, e) {
                        $(e).one('shown.bs.collapse', function () {
                            if (--todo == 0) {
                                resolve();
                            }
                        });
                    });

                } else {
                    resolve();
                }
            });
        });
    };

    DemoTour = new Tour({
        debug: true,
        backdrop: true,
        backdropPadding: 5,
        orphan: true,
        placement: 'top',
        steps: [
            {
                title: 'Demo Tour',
                content: "With this quick walk-through we'll show you all components of this demo. Tipp: You can use the arrow keys on your keyboard <kbd><i class='fa fa-arrow-left'></i></kbd>,<kbd><i class='fa fa-arrow-right'></i></kbd>.",
            },
            {
                element: '#stimulusForm',
                title: 'Entering a stimulus',
                content: "Let's jump right in and enter a stimulus, e.g. &ldquo;" + DEMO_SEARCH_TERM + "&rdquo;. As you can see the inputs are automatically disambiguated to Wikipedia Articles, allowing you to quickly pick the right semantic entity. On selection the article will be transformed to the corresponding DBpedia entity. Let's pick the first one.",
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
                            let autocompleteDoneHandler = function () {
                                let $typeahead = $('.typeahead.dropdown-menu');
                                $typeahead.find('li:first').addClass('active');
                                $typeahead.find('li:not(:first)').addClass('disabled');
                                $search.off('autocomplete.done', autocompleteDoneHandler);
                            };
                            $search.on('autocomplete.done', autocompleteDoneHandler);
                            $search.typeahead('lookup');
                        }
                        typeStep++;
                    }, 200);
                },
                onShow: function (tour) {
                    $stimulusForm.addClass('demo-mode');
                },
                onHidden: function (tour) {
                    $stimulusForm.removeClass('demo-mode');
                },
                onHide: function (tour) {
                    window.clearInterval(demoSearchInterval);
                    $('.typeahead.dropdown-menu li').removeClass('disabled');
                },
                onNext: function (tour) {
                    $search.val(DEMO_SEARCH_TERM);
                },
                onPrev: function (tour) {
                    $search.val('');
                },
                reflex: 'click'
            },
            {
                element: '#fusedPredictionContent .table',
                placement: 'top',
                title: 'Prediction Results',
                content: 'After a short while, you will see the fused prediction results in this table. As you can see the top results of the fused prediction are quite similar to human associations.<br/>To get a feeling for the complexity of this ranking, it is useful to know that even only the one-neighborhood of <a href="'+DEMO_SEARCH_URI+'">dbr:'+DEMO_SEARCH_TERM+'</a> already contains about 500 out-neighbors and 1570 in-neighbors, most of which aren\'t good candidates for associations. The learned graph patterns (as we will see later) however are not limited to the direct neighborhood, but also use multi-hop relations for their prediction.',
                onShow: function (tour) {
                    let $tour = $('.popover.tour-tour');
                    $tour.find('.popover-title').text('Predicting');
                    $tour.find('.popover-content').text('please wait (typically takes a couple of seconds)');
                    return forceShowFusedResults();
                }
            },
            {
                element: '#fusionDropdownGroup',
                placement: 'top',
                title: 'Choose a fusion method',
                content: 'The scores and ranking of the prediction results depend on the selected fusion method: In its raw form, each graph pattern (as we will see in a second) results in an unranked list of target candidates. The fusion method combines, scores and ranks these individual candidate lists. You can hover over the fusion methods to see a short explanation for each of them.',
                onShow: function (tour) {
                    return forceShowFusedResults();
                }
            },
            {
                element: filterButtonSelector,
                title: 'Get explanations of predictions',
                content: 'To see which of the raw graph patterns was involved in predicting this target candidate &ldquo;'+DEMO_EXPLAIN_RESULT_TERM+'&rdquo; to be associated with &ldquo;'+DEMO_SEARCH_TERM+'&rdquo;, you can click on this button.',
                onShow: function () {
                    return forceShowFusedResults();
                },
                reflex: true,
            },
            {
                element: 'li.list-group-item.graphPattern.active:first',
                placement: 'top',
                title: 'Graph Patterns',
                content: 'The explain button switches to the Graph Patterns tab. Normally this tab simply shows all graph patterns, but after clicking explain, it will focus on only those graph patterns that generated the to be explained target (&ldquo;'+DEMO_EXPLAIN_RESULT_TERM+'&rdquo; in this case).',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            },
            {
                element: 'li.list-group-item.graphPattern.active:first div.sparql',
                title: 'Graph Patterns SPARQL',
                placement: 'top',
                content: 'On top of each graph pattern you can see its SPARQL representation. Each query contains at least one <code>?source</code> and <code>?target</code> variable. When entering a stimulus above (as you have done before), for prediction its semantic entity will be inserted in place of all <code>?source</code> variables. Next, each SPARQL query will be executed and the <code>?target</code> variable selected. The results form the raw target candidates which become the input for the selected fusion method as mentioned before.',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            },
            {
                element: 'li.list-group-item.graphPattern.active:first div.info',
                title: 'Graph & Info',
                placement: 'top',
                content: 'Additionally, by clicking the "Graph & Info" drop-down, you can view each pattern graphically and see its fitness information from training. For more information on this, please see <a href="https://w3id.org/associations/#paper_gplearner">the graph learner paper</a>.',
                onShow: function (tour) {
                    return new Promise((resolve, reject) => {
                        let $div = $('li.list-group-item.graphPattern.active:first div.info');
                        $div.one('shown.bs.collapse', resolve);
                        if (! $div.hasClass('collapse')) {
                            resolve();
                            return;
                        }
                        // only open the info drop-down if it's closed
                        $('li.list-group-item.graphPattern.active:first a.info').click();
                    });
                },
                onHide: function () {
                    $('li.list-group-item.graphPattern.active:first a.info:not(.collapsed)').click();
                }
            },
            {
                element: 'li.list-group-item.graphPattern.active:first div.targets',
                title: 'Graph Patterns Targets',
                placement: 'top',
                content: 'Below you can see the targets that were predicted by this one graph pattern for the entered stimulus &ldquo;'+DEMO_SEARCH_TERM+'&rdquo;.',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            },
            {
                element: 'li.list-group-item.graphPattern.active:first div.targets li.bg-info',
                title: 'Explained Target',
                placement: 'top',
                content: 'The to be explained target (&ldquo;'+DEMO_EXPLAIN_RESULT_TERM+'&rdquo;) is highlighted.',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            },
            {
                element: 'li.list-group-item.graphPattern.active:first a.targets span',
                title: 'Graph Patterns Targets Count',
                placement: 'top',
                content: 'Here you can see how many target candidates the current pattern generated. Some patterns are very noisy and generate a lot of candidates, while others are very precise. Many of the fusion components take this into account.',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            },
            {
                element: '#gp-count',
                title: 'Contributing Graph Patterns Count',
                content: 'Similar to the count of targets generated by a single graph pattern, here you can see the count of all graph patterns contributing the currently selected (to be explained) target candidate. If you did not click "explain" yet, or if you clear the filter, you see the overall count of patterns used for prediction (100).',
                onShow: function (tour) {
                    return forceShowExplanation();
                }
            },
            {
                element: '#btnAllSPARQLCollapse',
                title: 'Collapse all SPARQL',
                content: 'To get a quick overview, you can collapse all SPARQL representations...',
                onShow: function (tour) {
                    return forceShowExplanation();
                },
                onNext: function (tour) {
                    $('#btnAllSPARQLCollapse').click();
                }
            },
            {
                element: '#btnAllTargetsCollapse',
                title: 'Collapse all Targets',
                content: '... and all targets.',
                onNext: function (tour) {
                    $('#btnAllTargetsCollapse').click();
                },
            },
            {
                element: '#btnFilterToggle',
                title: 'Toggling / Clearing the Filter',
                content: 'As you clicked the "explain" button before, only graph patterns were shown and are selected that are relevant for the target to be explained (&ldquo;'+DEMO_EXPLAIN_RESULT_TERM+'&rdquo;). With this you can button you can toggle showing all or only the selected graph patterns...',
                onNext: function (tour) {
                    // .active makes sure the filter is currently set
                    $('#btnFilterToggle.active').click();
                },
            },
            {
                element: '#btnFilterForget',
                title: 'Toggling / Clearing the Filter',
                content: '... and reset the selection altogether with this button.',
                onShow: function (tour) {
                    return new Promise((resolve, reject) => {
                        let $tabLink = $('#graphPatternsTabLink');
                        if ($tabLink.parent().hasClass('active')) {
                            resolve();
                        } else {
                            $tabLink
                                .one('shown.bs.tab', resolve)
                                .tab('show');
                        }
                    });
                },
                onNext: function (tour) {
                    $('#btnFilterForget').click();
                }
            },
            {
                element: '.btn-group.feedback:first',
                title: 'Help us to improve',
                content: 'If you want, you can help us to improve in the future. Click these buttons if you think a predicted response is correct/incorrect.',
                onShow: function () {
                    return forceShowFusedResults();
                },
                reflex: true,
            },
            {
                title: 'End of Tour',
                content: "That's it, feel free to play around with this demo. If you like it or have any other feedback, let us know ;)",
            },


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
