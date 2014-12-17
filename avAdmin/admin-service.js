angular.module('avAdmin')

    .factory('AuthApi', ['$http', function($http) {
        var backendUrl = "";
        var authapi = {};

        // TEST
        //authapi.test = function() {
        //    return $http.get(backendUrl);
        //};

        return authapi;

    }])

    .factory('ElectionsApi', ['$http', function($http) {
        var backendUrl = "";
        var electionsapi = {};

        // FAKE, TODO make it real
        electionsapi.elections = function(adminid, adminauth) {
            var els = [];
            els.push({
                "authorities": [
                    "agora-auth4"
                ],
                "description": "Votación con layout normal",
                "director": "wadobo-auth3",
                "end_date": "2014-12-28T09:00:00",
                "id": 1,
                "layout": "normal",
                "presentation": {
                    "share_text": "Ya he votado en las primarias en Madrid de @ahorapodemos ¿y tú?",
                    "theme": "podemos",
                    "theme_css": "",
                    "urls": []
                },
                "questions": [
                    {
                        "answer_total_votes_percentage": "over-total-valid-votes",
                        "answers": [
                            {
                                "details": "",
                                "id": 0,
                                "sort_order": 0,
                                "text": "Fulanito",
                                "urls": []
                            },
                            {
                                "details": "",
                                "id": 1,
                                "sort_order": 1,
                                "text": "Sutanito",
                                "urls": []
                            },
                            {
                                "details": "",
                                "id": 2,
                                "sort_order": 2,
                                "text": "Menganito",
                                "urls": []
                            }
                        ],
                        "description": "Elige quien quieres que sea tu Secretario General en tu municipio",
                        "layout": "simple",
                        "max": "1",
                        "min": "0",
                        "num_winners": "1",
                        "randomize_answer_order": true,
                        "tally_type": "plurality-at-large",
                        "title": "Secretario General"
                    },
                    {
                        "answer_total_votes_percentage": "over-total-valid-votes",
                        "answers": [
                            {
                                "category": "Claro que Podemos",
                                "details": "",
                                "id": 0,
                                "sort_order": 0,
                                "text": "Fulanita",
                                "urls": []
                            },
                            {
                                "category": "Claro que Podemos",
                                "details": "",
                                "id": 1,
                                "sort_order": 1,
                                "text": "Menganita",
                                "urls": []
                            },
                            {
                                "category": "Otra cosa",
                                "details": "",
                                "id": 2,
                                "sort_order": 2,
                                "text": "Pepito",
                                "urls": []
                            },
                            {
                                "category": "Otra cosa",
                                "details": "",
                                "id": 3,
                                "sort_order": 3,
                                "text": "Juanito",
                                "urls": []
                            }
                        ],
                        "description": "Elige los miembros del Consejo Ciudadano",
                        "layout": "accordion",
                        "max": "3",
                        "min": "1",
                        "num_winners": "7",
                        "randomize_answer_order": true,
                        "tally_type": "plurality-at-large",
                        "title": "Consejo Ciudadano"
                    }
                ],
                "start_date": "2014-12-26T09:00:00",
                "title": "Votaciones Municipales"
            });

            var fakeresponse = {
                success: function(f) { var data = {status: "ok", elections: els}; f(data); },
                error: function(f) { var data = {elections: els}; f(data); }
            };

            return fakeresponse;
        };

        return electionsapi;
    }]);
