var CodePadTab_Bespin = function(opts){
    this.opts = {
        holder: ''
    };
    $.extend(true, this.opts, opts);

    var context = this;

    this.Open = function(file, content, holder){
        this.file = file;
        this.textarea = $('<textarea style="width:100%;height:100%"></textarea>');
        this.textarea.val(content);
        this.wrap = $('<table style="background-color:#fff;height:100%;width:100%" border="0" cellspacing="0" cellpadding="0"><tr><td height="100%"></td></tr></table>');
        this.wrap.find('td').append(this.textarea);
        $(holder != null ? holder : this.opts.holder).append(this.wrap);
        
        var syntax = (/[.]/.exec(file)) ? /[^.]+$/.exec(file) + '' : '';
        if(syntax == 'json') syntax = 'js';
        bespin.useBespin(this.textarea.get(0), {
            stealFocus: true,
            syntax: syntax
        }).then(
            function(env){
                context.env = env;
            },
            function(error) {
                throw new Error("Bespin launch failed: " + error);
            }
        );
    };

    this.Close = function(){

    };

    this.Value = function(value){
        if(value == null){
            return this.env.editor.value;
        }else{
            this.env.editor.value = value;
        }
    };

    this.Refresh = function(){
        if(context.env != null){
            context.env.dimensionsChanged();
        }
    };

    this.ToggleWordWrapping = function(){};
};