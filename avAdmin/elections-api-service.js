angular.module('avAdmin')
    .factory('ElectionsApi', ['$q', 'Authmethod', 'ConfigService', '$i18next', '$http', function($q, Authmethod, ConfigService, $i18next, $http) {
        var backendUrl = ConfigService.electionsAPI;
        var electionsapi = {cache: {}, permcache: {}};
        electionsapi.waitingCurrent = [];
        electionsapi.currentElection = {};
        electionsapi.currentElections = [];
        electionsapi.newElection = false;

        electionsapi.waitForCurrent = function(f) {
            if (electionsapi.currentElection.title) {
                f();
            } else {
                electionsapi.waitingCurrent.push(f);
            }
        };

        electionsapi.setCurrent = function(el) {
            electionsapi.currentElection = el;
            electionsapi.waitingCurrent.forEach(function(f) {
                f();
            });
            electionsapi.waitingCurrent = [];
        };

        function asyncElection(id) {
            var deferred = $q.defer();

            electionsapi.election(id)
                .success(function(data) {
                    var el = electionsapi.parseElection(data);
                    deferred.resolve(el);
                }).error(deferred.reject);

            return deferred.promise;
        }

        function asyncElectionAuth(el) {
            var deferred = $q.defer();

            Authmethod.viewEvent(el.id)
                .success(function(data) {
                    el.auth = {};
                    el.auth.authentication = data.events.auth_method;
                    el.auth.census = data.events.users;
                    if (el.auth.census) {
                        el.votes = el.stats.votes;
                        el.votes_percentage = ( el.stats.votes * 100 )/ el.auth.census;
                    } else {
                        el.votes_percentage = 0;
                        el.votes = el.stats.votes || 0;
                    }

                    // updating census
                    el.census.auth_method = data.events.auth_method;
                    el.census.extra_fields = data.events.extra_fields;
                    el.census.census = data.events.census;

                    deferred.resolve(el);
                })
                .error(deferred.reject);

            return deferred.promise;
        }

        electionsapi.cache_election = function(id, election) {
            electionsapi.chache[id] = election;
        };

        electionsapi.getElection = function(id, ignorecache) {
            var deferred = $q.defer();

            var cached = electionsapi.cache[id];
            if (ignorecache || !cached) {
                asyncElection(id)
                  .then(electionsapi.stats)
                  .then(asyncElectionAuth)
                  .then(deferred.resolve)
                  .catch(deferred.reject);
            } else {
                deferred.resolve(cached);
            }

            return deferred.promise;
        };

        electionsapi.election = function(id) {
            return $http.get(backendUrl + 'election/'+id);
        };

        electionsapi.parseElection = function(d) {
            var election = d.payload;
            var conf = electionsapi.templateEl();
            conf = _.extend(conf, election.configuration);
            conf.status = election.state;
            conf.stats = {};
            conf.results = {};

            conf.votes = 0;
            conf.votes_percentage = 0;

            // number of answers
            conf.answers = 0;
            conf.questions.forEach(function(q) {
                conf.answers += q.answers.length;
            });

            // adding director to the list of authorities
            conf.auths = [conf.director, ];
            conf.authorities.forEach(function(a) { conf.auths.push(a); });

            // results
            if (election.results) {
                conf.results = angular.fromJson(election.results);
            }

            // caching election
            electionsapi.cache[conf.id] = conf;
            return conf;
        };

        electionsapi.getEditPerm = function(id) {
            var deferred = $q.defer();

            var cached = electionsapi.permcache[id];
            if (!cached) {
                Authmethod.getPerm("edit", "AuthEvent", id)
                    .success(function(data) {
                        var perm = data['permission-token'];
                        electionsapi.permcache[id] = perm;
                        deferred.resolve(perm);
                    });
            } else {
                deferred.resolve(cached);
            }

            return deferred.promise;
        };

        electionsapi.stats = function(el) {
            var deferred = $q.defer();

            electionsapi.command(el, 'stats', 'GET')
                .then(function(d) {
                        el.stats = d.payload;
                        deferred.resolve(el);
                      })
                 .catch(deferred.reject);

            return deferred.promise;
        };

        electionsapi.autoreloadStatsTimer = null;
        electionsapi.autoreloadStats = function(el) {
            clearTimeout(electionsapi.autoreloadStatsTimer);
            if (!el) {
                return;
            }

            electionsapi.stats(el)
                .then(asyncElectionAuth)
                .finally(function() {
                    electionsapi.autoreloadStatsTimer = setTimeout(function() { electionsapi.autoreloadStats(el); }, 5000);
                });
        };

        electionsapi.results = function(el) {
            var deferred = $q.defer();

            electionsapi.command(el, 'results', 'GET')
                .then(function(d) {
                        el.results = angular.fromJson(d.payload);
                        deferred.resolve(el);
                      })
                 .catch(deferred.reject);

            return deferred.promise;
        };

        electionsapi.command = function(el, command, method, data) {
            var deferred = $q.defer();
            var m = {};
            var d = data || {};
            var url = backendUrl + 'election/'+el.id;

            if (command) {
                url += '/'+command;
            }

            electionsapi.getEditPerm(el.id)
                .then(function(perm) {
                    if (method === "POST") {
                        m = $http.post(url, data, {headers: {'Authorization': perm}});
                    } else {
                        m = $http.get(url, {headers: {'Authorization': perm}});
                    }

                    m.success(deferred.resolve).error(deferred.reject);
                });

            return deferred.promise;
        };

        electionsapi.templateEl = function() {
            var el = {
                title: $i18next('avAdmin.sidebar.newel'),
                description: "",
                start_date: "2015-01-27T16:00:00.001",
                end_date: "2015-01-27T16:00:00.001",
                authorities: ConfigService.authorities,
                director: ConfigService.director,
                presentation: {
                    theme: 'default',
                    share_text: '',
                    urls: [],
                    theme_css: ''
                },
                layout: 'simple',
                census: {
                    voters: [],
                    auth_method: 'email',
                    census:'open',
                    extra_fields: [ ],
                    config: {
                        "msg": $i18next('avAdmin.auth.emaildef'),
                        "subject": $i18next('avAdmin.auth.emailsub')
                    }
                },
                questions: []
            };
            return el;
        };

        electionsapi.templateQ = function(title) {
            var q = {
                "answer_total_votes_percentage": "over-total-valid-votes",
                "answers": [],
                "description": "",
                "layout": "simple",
                "max": 1,
                "min": 1,
                "num_winners": 1,
                "randomize_answer_order": true,
                "tally_type": "plurality-at-large",
                "title": title
            };
            return q;
        };

        electionsapi.getCensus = function(el) {
            el.census.voters = [];
            var deferred = $q.defer();

            function getAuthCensus(d) {
                var voters = d.payload;
                var deferred = $q.defer();
                Authmethod.getCensus(el.id)
                    .success(function(data) {
                        el.census.voters = data.object_list;
                        _.each(data.object_list, function(user) {
                            user.vote = false;
                            if (voters.indexOf(user.username) >= 0) {
                                user.vote = true;
                            }
                        });
                        // TODO merge with voters
                        deferred.resolve(el);
                    })
                    .error(deferred.reject);
                return deferred.promise;
            }

            electionsapi.command(el, 'voters', 'GET')
                .then(getAuthCensus)
                .then(deferred.resolve)
                .catch(deferred.reject);

            return deferred.promise;
        };

        return electionsapi;
    }]);
