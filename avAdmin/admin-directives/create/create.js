angular.module('avAdmin')
  .directive('avAdminCreate', ['$q', 'Authmethod', 'ElectionsApi', '$state', '$i18next', 'ConfigService',
    function($q, Authmethod, ElectionsApi, $state, $i18next, ConfigService) {
    // we use it as something similar to a controller here
    function link(scope, element, attrs) {
        var adminId = ConfigService.freeAuthId;
        scope.creating = false;
        scope.log = '';
        scope.createElectionBool = true;

        if (ElectionsApi.currentElections.length === 0 && !!ElectionsApi.currentElection) {
          scope.elections = [ElectionsApi.currentElection];
        } else {
          scope.elections = ElectionsApi.currentElections;
          ElectionsApi.currentElections = [];
        }

        function logInfo(text) {
          scope.log += "<p>" + text + "</p>";
        }

        function logError(text) {
          scope.log += "<p class=\"text-brand-danger\">" + text + "</p>";
        }

        function createAuthEvent(el) {
            console.log("creating auth event for election " + el.title);
            var deferred = $q.defer();
            // Creating the authentication
            logInfo($i18next('avAdmin.create.creating', {title: el.title}));

            if (el.census.config.subject && el.census.auth_method !== 'email') {
              delete el.census.config.subject;
            }

            var d = {
                auth_method: el.census.auth_method,
                census: el.census.census,
                config: el.census.config,
                extra_fields: []
            };

            d.extra_fields = _.filter(el.census.extra_fields, function(ef) {
              var must = ef.must;
              delete ef.disabled;
              delete ef.must;
              if (_.contains(['bool', 'captcha'], ef.type)) {
                delete ef.min;
                delete ef.max;
              } else {
                if (!!ef.min) {
                  ef.min = parseInt(ef.min);
                }
                if (!!ef.max) {
                  ef.max = parseInt(ef.max);
                }
              }
              return !must;
            });

            Authmethod.createEvent(d)
                .success(function(data) {
                    el.id = data.id;
                    deferred.resolve(el);
                }).error(deferred.reject);
            return deferred.promise;
        }

        function addCensus(el) {
            console.log("adding census for election " + el.title);
            var deferred = $q.defer();
            // Adding the census
            logInfo($i18next('avAdmin.create.census', {title: el.title, id: el.id}));
            var voters = _.map(el.census.voters, function (i) { return i.metadata; });
            Authmethod.addCensus(el.id, voters, 'disabled')
                .success(function(data) {
                    deferred.resolve(el);
                }).error(deferred.reject);
            return deferred.promise;
        }

        function registerElection(el) {
            console.log("registering election " + el.title);
            var deferred = $q.defer();
            // Registering the election
            logInfo($i18next('avAdmin.create.reg', {title: el.title, id: el.id}));
            ElectionsApi.command(el, '', 'POST', el)
                .then(function(data) { deferred.resolve(el); })
                .catch(deferred.reject);
            return deferred.promise;
        }

        function createElection(el) {
            var deferred = $q.defer();
            if (scope.createElectionBool) {
              console.log("creating election " + el.title);
              // Creating the election
              logInfo($i18next('avAdmin.create.creatingEl', {title: el.title, id: el.id}));
              ElectionsApi.command(el, 'create', 'POST', {})
                .then(function(data) { deferred.resolve(el); })
                .catch(deferred.reject);
            } else {
              deferred.resolve(el);
            }
            return deferred.promise;
        }

        function addElection(i) {
          var deferred = $q.defer();
          if (i === scope.elections.length) {
            var el = scope.elections[i - 1];
            $state.go("admin.dashboard", {id: el.id});
            return;
          }

          var promise = deferred.promise;
          promise = promise
            .then(createAuthEvent)
            .then(addCensus)
            .then(registerElection)
            .then(createElection)
            .then(function(el) {
                console.log("waiting for election " + el.title);
                waitForCreated(el.id, function () {
                  addElection(i+1);
                });
              })
              .catch(function(error) {
                scope.creating = false;
                scope.creating_text = '';
                logError(angular.toJson(error));
              });
          deferred.resolve(scope.elections[i]);
        }

        function createElections() {
            var deferred = $q.defer();
            addElection(0);
            var promise = deferred.promise;

            scope.creating = true;
        }

        function waitForCreated(id, f) {
          console.log("waiting for election id = " + id);
          ElectionsApi.getElection(id, true)
            .then(function(el) {
                var deferred = $q.defer();
                if (scope.createElectionBool && el.status === 'created' ||
                  !scope.createElectionBool && el.status === 'registered')
                {
                  f();
                } else {
                  setTimeout(function() { waitForCreated(id, f); }, 3000);
                }
            });
        }

        angular.extend(scope, {
          createElections: createElections,
        });
    }

    return {
      restrict: 'AE',
      scope: {
      },
      link: link,
      templateUrl: 'avAdmin/admin-directives/create/create.html'
    };
  }]);
