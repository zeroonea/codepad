var CodePadTab_CodeMirror = function(opts){
    this.opts = {
        holder: '',
        base_path: ''
    };
    $.extend(true, this.opts, opts);

    var context = this;

    this.Open = function(file, content, holder){
        this.file = file;
        this.textarea = $('<textarea style="width:100%;height:100%;"></textarea>');
        this.textarea.val(content);
        this.wrap = $('<table style="background-color:#fff;height:100%;width:100%" border="0" cellspacing="0" cellpadding="0"><tr><td height="100%"></td></tr></table>');
        this.wrap.find('td').append(this.textarea);
        $(holder != null ? holder : this.opts.holder).append(this.wrap);
        
        var syntax = (/[.]/.exec(file)) ? /[^.]+$/.exec(file) + '' : '';
        var parserfile = 'parsedummy.js', stylesheet = [];
        if(syntax == 'php'){
            parserfile = ['parsexml.js', 'parsecss.js', 'tokenizejavascript.js', 'parsejavascript.js',
                '../contrib/php/js/tokenizephp.js', '../contrib/php/js/parsephp.js',
                '../contrib/php/js/parsephphtmlmixed.js'];
            stylesheet = [this.opts.base_path + 'css/xmlcolors.css',
                this.opts.base_path + 'css/jscolors.css',
                this.opts.base_path + 'css/csscolors.css',
                this.opts.base_path + 'contrib/php/css/phpcolors.css'];
        }else if(syntax == 'js' || syntax == 'json'){
            parserfile = ['tokenizejavascript.js', 'parsejavascript.js'];
            stylesheet = this.opts.base_path +  'css/jscolors.css';
        }else if(syntax == 'html'){
            parserfile = ['parsexml.js', 'parsecss.js', 'tokenizejavascript.js', 'parsejavascript.js', 'parsehtmlmixed.js'];
            stylesheet = [this.opts.base_path + 'css/xmlcolors.css',
                this.opts.base_path + 'css/jscolors.css',
                this.opts.base_path + 'css/csscolors.css'];
        }else if(syntax == 'css'){
            parserfile = 'parsecss.js';
            stylesheet = this.opts.base_path + 'css/csscolors.css';
        }

        context.env = CodeMirror.fromTextArea($(this.textarea).get(0), {
            width: '100%',
            parserfile: parserfile,
            stylesheet: stylesheet,
            path: this.opts.base_path + 'js/',
            continuousScanning: 500,
            tabMode: 'indent',
            textWrapping: false
            //lineNumbers: true
        });
        context.word_wrapping = false;
    };

    this.Close = function(){

    };

    this.Value = function(value){
        if(value == null){
            return this.env.getCode();
        }else{
            this.env.setCode(value);
        }
    };

    this.Refresh = function(){
        
    };

    this.ToggleWordWrapping = function(){
        this.word_wrapping = !this.word_wrapping;
        this.env.setTextWrapping(this.word_wrapping);
        return this.word_wrapping;
    };
};