/*
 * Casting Ballot Screen directive.
 *
 * Shown while the ballot is being encrypted and sent.
 */
angular.module('avBooth')
  .directive('avbCastingBallotScreen', function($i18next, CastBallotService, $timeout) {

    function link(scope, element, attrs) {
      // moves the title on top of the busy indicator
      scope.updateTitle = function(title) {
        var titleEl = element.find(".avb-busy-title").html(title);

        // set margin-top
        var marginTop = - titleEl.height() - 45;
        var marginLeft = - titleEl.width()/2;
        titleEl.attr("style", "margin-top: " + marginTop + "px; margin-left: " + marginLeft + "px");
      };

      // function that receives updates from the cast ballot service and shows
      // them to the user
      function statusUpdateFunc(status, options) {
        if (status === "sanityChecks") {
          scope.updateTitle($i18next(
            "avBooth.statusExecutingSanityChecks",
            {
              percentage: options.percentageCompleted
            }));
          scope.percentCompleted = options.percentageCompleted;

        } else if (status === "encryptingQuestion") {
          scope.updateTitle($i18next(
            "avBooth.statusEncryptingQuestion",
            {
              questionNum: options.questionNum + 1,
              percentage: options.percentageCompleted
            }));
          scope.percentCompleted = options.percentageCompleted;

        } else if (status === "verifyingQuestion") {
          scope.updateTitle($i18next(
            "avBooth.statusVerifyingQuestion",
            {
              questionNum: options.questionNum + 1,
              percentage: options.percentageCompleted
            }));
          scope.percentCompleted = options.percentageCompleted;

        } else if (status === "sendingBallot") {
          scope.updateTitle($i18next(
            "avBooth.sendingBallot",
            {percentage: options.percentageCompleted}));
          scope.percentCompleted = options.percentageCompleted;
        }
      }
      // delay in millisecs
      var delay = 500;

      $timeout(function () {
        CastBallotService({
          election: scope.election,
          statusUpdate: statusUpdateFunc,

          // on success, we show the next screen (which is the success-screen
          // directive)
          success: function() {
            scope.updateTitle($i18next("avBooth.ballotCast", {percentage: 100}));
            scope.percentCompleted = 100;
            scope.next();
          },

          // on error, try to deal with it
          error: function (status, message) {
            if (status === "couldntSendBallot") {
              // TODO show "try again" button somehow if it's a network problem.
              // hopefully, without having to encrypt again the ballot
              scope.showError("error sending the ballot. " + message);
            } else {
              scope.showError("unknown error casting th ballot. "  + message);
            }
          },
          verify: false,
          delay: delay
        });
      }, delay);
    }

    return {
      restrict: 'E',
      link: link,
      templateUrl: 'avBooth/casting-ballot-screen-directive/casting-ballot-screen-directive.html'
    };
  });