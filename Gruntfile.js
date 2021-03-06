/*jslint node: true */
'use strict';

var pkg = require('./package.json');

//Using exclusion patterns slows down Grunt significantly
//instead of creating a set of patterns like '**/*.js' and '!**/node_modules/**'
//this method is used to create a set of inclusive patterns for all subdirectories
//skipping node_modules, bower_components, dist, and any .dirs
//This enables users to create any directory structure they desire.
var createFolderGlobs = function(fileTypePatterns) {
  fileTypePatterns = Array.isArray(fileTypePatterns) ? fileTypePatterns : [fileTypePatterns];
  var ignore = ['node_modules','bower_components','dist','temp'];
  var fs = require('fs');
  return fs.readdirSync(process.cwd())
          .map(function(file){
            if (ignore.indexOf(file) !== -1 ||
                file.indexOf('.') === 0 ||
                !fs.lstatSync(file).isDirectory()) {
              return null;
            } else {
              return fileTypePatterns.map(function(pattern) {
                return file + '/**/' + pattern;
              });
            }
          })
          .filter(function(patterns){
            return patterns;
          })
          .concat(fileTypePatterns);
};

module.exports = function (grunt) {

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    connect: {
      main: {
        options: {
          port: 9001
        }
      }
    },
    watch: {
      main: {
        options: {
            livereload: true,
            livereloadOnError: false,
            spawn: false
        },
        files: [createFolderGlobs(['*.js','*.less','*.html']),'!_SpecRunner.html','!.grunt'],
        tasks: [] //all the tasks are run dynamically during the watch event handler
      }
    },
    jshint: {
      main: {
        options: {
            jshintrc: '.jshintrc'
        },
        src: createFolderGlobs('*.js')
      }
    },
    clean: {
      before:{
        src:['dist','temp']
      },
      after: {
        src:['temp']
      }
    },
    less: {
      production: {
        options: {
        },
        files: [{
          expand: true,
          src: ['themes/**/app.less'],
          dest: 'temp/',
          ext: '.css',
        }]
      }
    },
    autoprefixer: {
      options: {
        browsers: ['ie >= 8', 'ff > 4', 'last 8 versions']
      },
      main: {
        src: 'temp/themes/**/app.css'
      }
    },
    ngtemplates: {
      main: {
        options: {
            module: pkg.name,
            htmlmin:'<%= htmlmin.main.options %>'
        },
        src: [createFolderGlobs('*.html'),'!index.html','!_SpecRunner.html'],
        dest: 'temp/templates.js'
      }
    },
    copy: {
      main: {
        files: [
          {src: ['img/**'], dest: 'dist/'},
          {src: ['temp_data/**'], dest: 'dist/'},
          {
            expand: true,
            cwd: 'bower_components/bootstrap/fonts/',
            src: ['**'],
            dest: 'dist/themes/fonts/'
          },
          {
            expand: true,
            cwd: 'bower_components/bootstrap/fonts/',
            src: ['**'],
            dest: 'dist/themes/fonts/'
          },
          {
            expand: true,
            cwd: 'bower_components/font-awesome/fonts/',
            src: ['**'],
            dest: 'dist/fonts/'
          }
          //{src: ['bower_components/angular-ui-utils/ui-utils-ieshiv.min.js'], dest: 'dist/'},
          //{src: ['bower_components/select2/*.png','bower_components/select2/*.gif'], dest:'dist/css/',flatten:true,expand:true},
          //{src: ['bower_components/angular-mocks/angular-mocks.js'], dest: 'dist/'}
        ]
      }
    },
    dom_munger:{
      read: {
        options: {
          read:[
            {selector:'script[class="libnocompat"]',attribute:'src',writeto:'libnocompatjs'},
            {selector:'script[class="lib"]',attribute:'src',writeto:'libjs'},
            {selector:'script[class="app"]',attribute:'src',writeto:'appjs'},
            {selector:'link[rel="stylesheet"][data-concat!="false"]',attribute:'href',writeto:'appcss'}
          ]
        },
        src: 'index.html'
      },
      update: {
        options: {
          remove: ['script[data-remove!="false"]','link[data-remove!="false"]'],
          append: [
            {selector:'body',html:'<!--[if lte IE 8]><script src="libcompat-v3.0-b1.min.js"></script><![endif]--><!--[if gte IE 9]><script src="libnocompat-v3.0-b1.min.js"></script><![endif]--><!--[if !IE]><!--><script src="libnocompat-v3.0-b1.min.js"></script><!--<![endif]-->'},
            {selector:'body',html:'<!--All the source code of this program under copyright. Take a look at the license details at https://github.com/agoravoting/agora-core-view/blob/master/README.md -->'},
            {selector:'body',html:'<script src="lib-v3.0-b1.min.js"></script>'},
            {selector:'body',html:'<script src="avConfig-v3.0-b1.js"></script>'},
            {selector:'body',html:'<script src="avThemes-v3.0-b1.js"></script>'},
            {selector:'body',html:'<script src="app-v3.0-b1.min.js"></script>'},
            {selector:'body',html:'<script src="avPlugins-v3.0-b1.js"></script>'},
            {selector:'head',html:'<link rel="stylesheet" id="theme" href="themes/default/app.min.css">'}
          ]
        },
        src:'index.html',
        dest: 'dist/index.html'
      }
    },
    cssmin: {
      main: {
        files: [{
            expand: true,
            cwd:'temp/themes',
            src: ['**/app.css'],
            dest: 'dist/themes/',
            ext: '.min.css',
            extDot: 'first'
        }]
      },
    },
    concat: {
      main: {
        files: {
          'temp/libcompat.js': [
            'vendor/jquery.compat/jquery-1.11.1.js',
            'vendor/json3/json-v3.3.2.js',
            'vendor/crypto/unsupportedBrowser.js'
          ],
          'temp/libnocompat.js': ['<%= dom_munger.data.libnocompatjs %>'],
          'temp/lib.js': ['<%= dom_munger.data.libjs %>'],
          'temp/app.js': ['<%= dom_munger.data.appjs %>','<%= ngtemplates.main.dest %>'],
          'dist/avConfig-v3.0-b1.js': ['avConfig.js'],
          'dist/avThemes-v3.0-b1.js': ['avThemes.js'],
          'dist/avPlugins-v3.0-b1.js': ['plugins/**/*.js']
        }
      }
    },
    "merge-json": {
      main: {
        files: {
            "dist/locales/en.json": ["locales/en.json", "plugins/**/locales/en.json"],
            "dist/locales/es.json": ["locales/es.json", "plugins/**/locales/es.json"],
            "dist/locales/ca.json": ["locales/ca.json", "plugins/**/locales/ca.json"]
        }
      }
    },
    ngAnnotate: {
      main: {
        files: {
        'temp/app.js':['temp/app.js'],
        'temp/lib.js': ['temp/lib.js'],
        'temp/libnocompat.js': ['temp/libnocompat.js'],
        'temp/libcompat.js': ['temp/libcompat.js']
        }
      }
    },
    uglify: {
      main: {
        options:{
          mangle: false,
          compress: true,
          beautify: true
        },
        files: {
          'dist/app-v3.0-b1.min.js': 'temp/app.js',
          'dist/lib-v3.0-b1.min.js': 'temp/lib.js',
          'dist/libnocompat-v3.0-b1.min.js': 'temp/libnocompat.js',
          'dist/libcompat-v3.0-b1.min.js': 'temp/libcompat.js',
          'dist/avWidgets.min.js': 'avWidgets.js'
        }
      }
    },
    htmlmin: {
      main: {
        options: {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: false,
          removeComments: false,
          removeEmptyAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true
        },
        files: {
          'dist/index.html': 'dist/index.html'
        }
      }
    },
    imagemin: {
      main:{
        files: [{
          expand: true, cwd:'dist/',
          src:['**/{*.png,*.jpg}'],
          dest: 'dist/'
        }]
      }
    },
    karma: {
      options: {
        frameworks: ['jasmine'],
        files: [  //this files data is also updated in the watch handler, if updated change there too
          '<%= dom_munger.data.libnocompatjs %>',
          '<%= dom_munger.data.libjs %>',
          'avConfig.js',
          'avThemes.js',
          'avWidgets.js',
          '<%= dom_munger.data.appjs %>',
          '<%= ngtemplates.main.dest %>',
          'bower_components/angular-mocks/angular-mocks.js',
          createFolderGlobs('*-spec.js')
        ],
        logLevel:'ERROR',
        reporters:['mocha'],
        autoWatch: false, //watching is handled by grunt-contrib-watch
        singleRun: true
      },
      all_tests: {
        browsers: ['PhantomJS','Chrome','Firefox']
      },
      during_watch: {
        browsers: ['PhantomJS']
      },
    },
    protractor: {
      options: {
        configFile: "node_modules/protractor/referenceConf.js", // Default config file
        keepAlive: true, // If false, the grunt process stops when the test fails.
        noColor: false, // If true, protractor will not use colors in its output.
        args: {
        // Arguments passed to the command
      }
    },
    //your_target: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
      all: {
      options: {
        configFile: "e2e.conf.js", // Target-specific config file
        args: {} // Target-specific arguments
      }
    },
  },

  });

  grunt.registerTask('build',['jshint','clean:before','less','autoprefixer','dom_munger','ngtemplates','cssmin','concat','merge-json','ngAnnotate','uglify','copy','htmlmin','imagemin','clean:after']);
  grunt.registerTask('serve', ['dom_munger:read','jshint','connect', 'watch']);
  grunt.registerTask('test',['dom_munger:read','karma:all_tests']);

  grunt.event.on('watch', function(action, filepath) {
    //https://github.com/gruntjs/grunt-contrib-watch/issues/156

    var tasksToRun = [];

    if ((filepath.lastIndexOf('.json') !== -1 && filepath.lastIndexOf('.json') === filepath.length - 5) ||
        (filepath.lastIndexOf('.js') !== -1 && filepath.lastIndexOf('.js') === filepath.length - 3)) {

      //lint the changed js file
      grunt.config('jshint.main.src', filepath);
      tasksToRun.push('jshint');

      //find the appropriate unit t est for the changed file
      var spec = filepath;
      if (filepath.lastIndexOf('-spec.js') === -1 || filepath.lastIndexOf('-spec.js') !== filepath.length - 8) {
        spec = filepath.substring(0,filepath.length - 3) + '-spec.js';
      }

      //if the spec exists then lets run it
      if (grunt.file.exists(spec)) {
        var files = [].concat(grunt.config('dom_munger.data.libnocompatjs'));
        files.concat(grunt.config('dom_munger.data.libjs'));
        files.push('bower_components/angular-mocks/angular-mocks.js');
        files.push('avConfig.js');
        files.push('avThemes.js');
        files.push('avWidgets.js');
        files.concat(grunt.config('dom_munger.data.appjs'));
        files.concat(grunt.config('ngtemplates.main.dest'));
        files.push(spec);
        grunt.config('karma.options.files', files);
        tasksToRun.push('karma:during_watch');
      }
    }

    //if index.html changed, we need to reread the <script> tags so our next run of karma
    //will have the correct environment
    if (filepath === 'index.html') {
      tasksToRun.push('dom_munger:read');
    }

    grunt.config('watch.main.tasks',tasksToRun);

  });

  grunt.loadNpmTasks('grunt-protractor-runner');
};
