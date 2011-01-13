var CodePad = function(opts){
    var context = this;
    this.opts = {
        toolbars: ['save,wrap,maximize'],
        files_json: null,

        load_files_callback: null,

        load_file_callback: null,
        open_file_callback: null,
        save_file_callback: null,
        create_file_callback: null,
        delete_file_callback: null
    };
    $.extend(true, this.opts, opts);

    this.buttons = {
        new_file: {
            title:'Create new file'
        },
        save: {
            title: 'Save current file',
            click: function(){
                context.SaveFile();
            }
        },
        wrap: {
            title: 'Toggle word wrapping mode',
            click: function(){
                if(context.ctab != null) context.ctab.ToggleWordWrapping();
            }
        },
        maximize: {
            title: 'Toggle fullscreen mode',
            click: function(){
                context.MM();
            }
        }
    };

    this.ctab = null;
    this.tabs = [];
    this.tabcount = 0;

    this.TreeHtml = function(files, foldername){
        var html = '';
        for(var filename in files){
            var child_html = this.TreeHtml(files[filename], foldername + '/' + filename);
            var ext = child_html != '' ? 'folder' : this.GetFileExtension(filename);
            var type = child_html != '' ? 'folder' : 'file';
            
            html += '<li rel="'+ext+'" data-'+ type +'="'+foldername + '/' + filename+'"><a href="javascript:void(0);">' + filename + '</a>' + child_html + '</li>';
        }
        if(html != ''){
            return '<ul>' + html + '</ul>';
        }else return '';
    };

    this.MakeFileTree = function(){
        if(this.opts.files_json != null){
            this.files = eval('(' + this.opts.files_json + ')');
        }
        $('#file-tree').html(this.TreeHtml(this.files, ''));
        $('#file-tree').jstree({
            core: {
                animation: 100
            },
            'plugins': [ 'themes', 'html_data' ],
            themes: {
                theme: 'classic'
            }
        });
        $('#file-tree').jstree("open_all");
        $('#file-tree li').each(function(){
            var li = this;
            $(li).find(' > a').bind('click', function(){
                $('#file-tree li').removeClass('selected');
                $(li).addClass('selected');
            });
            if($(li).attr('rel') != 'folder'){
                $(li).find(' > a').bind('dblclick', function(){
                    context.LoadFile($(li).data('file'));
                });
            }
        });
    };

    this.LoadFile = function(file){
        if(this.opts.load_file_callback != null){
            if(this.tabs[file] == null){
                if(typeof this.opts.load_file_callback == 'string' && iframe != null){
                    $('#spinner').css('display', '');
                    window.parent[this.opts.load_file_callback](file, this);
                }else if(typeof this.opts.load_file_callback == 'function'){
                    $('#spinner').css('display', '');
                    this.opts.load_file_callback(file, this);
                }
            }else{
                this.ActiveFile(file);
            }
        }
    };

    this.OpenFile = function(file, content){
        if(this.opts.open_file_callback){
            var tabid = 'file-tabs-' + (this.tabcount++);
            var ext = this.GetFileExtension(file);
            
            var tab = $('<div id="'+tabid+'"></div>');
            $('#codepad-holders').append(tab);
            $('#file-tabs').tabs('add', '#' + tabid, '<span class="ico16 '+ext+'"></span>&nbsp;' + this.GetFileName(file));
            $('#codepad-holders').append(tab);
            $('#file-tabs > ul').css('display', '');

            this.ctab = this.opts.open_file_callback(file, content, '#' + tabid);
            this.ctab.tabid = '#' + tabid;
            this.tabs[file] = this.ctab;

            $(tab).data('codepadtab', this.ctab);
            $('#file-tabs').tabs('select', '#' + tabid)
                .find('.ui-tabs-nav').sortable('destroy').sortable({
                    axis: "x"
                });
        }

        $('#spinner').css('display', 'none');
    };

    this.ActiveFile = function(file){
        if(this.tabs[file] != null){
            this.ctab = this.tabs[file];
            $('#file-tabs').tabs('select', this.ctab.tabid);
        }
    };

    this.SaveFile = function(){
        if(this.ctab != null && this.opts.save_file_callback != null){
            var text = this.ctab.Value();
            
            if(typeof this.opts.save_file_callback == 'string' && iframe != null){
                $('#spinner').css('display', '');
                window.parent[this.opts.save_file_callback](this.ctab.file, text, this);
            }else if(typeof this.opts.save_file_callback == 'function'){
                $('#spinner').css('display', '');
                this.opts.load_file_callback(this.ctab.file, text, this);
            }
        }
    };

    this.SaveAllFiles = function(){
        
    };

    this.GetFileExtension = function(file){
        return (/[.]/.exec(file)) ? /[^.]+$/.exec(file) + '' : '';
    };

    this.GetFileName = function(filepath){
        return (/[/]/.exec(filepath)) ? /[^/]+$/.exec(filepath) + '' : filepath;
    };

    this.MakeToolbars = function(){
        if(this.opts.toolbars.length > 0){
            for(var i = 0; i < this.opts.toolbars.length; i++){
                var tmp = this.opts.toolbars[i].split(',');
                var toolbar = $('<div></div>');

                for(var j = 0; j < tmp.length; j++){
                    var btn = this.buttons[tmp[j]];
                    btn.element = $('<a href="javascript:void(0);" title="'+btn.title+'"><span class="ico16 '+tmp[j]+'"></span></a>');
                    btn.element.bind('click', btn.click);
                    toolbar.append(btn.element);
                }

                $('#toolbars').append(toolbar);
            }
        }
    }

    this.MM = function(){
        if(iframe == null) return;
        
        if(iframe.maximize == null){
            $(window.parent.document.body).css('overflow', 'hidden');
            iframe.p_height = $(iframe).css('height');
            iframe.p_zindex = $(iframe).css('z-index');
            $(iframe).css({
                position: 'fixed', top: 0, left: 0,
                height: $(window.parent).height(),
                width: $(window.parent).width(),
                zIndex: 99999999
            });
            iframe.maximize = 1;
        }else{
            $(window.parent.document.body).css('overflow', '');
            $(iframe).css({
                position: '',
                height: iframe.p_height,
                width: '100%',
                zIndex: iframe.p_zindex
            });
            iframe.maximize = null;
        }
    }
    
    this.Error = function(msg, errcode){
        alert(msg);
        $('#spinner').css('display', 'none');
    };


    /** Init */
    /** Find iframe (in parent) */
    var iframe = null;
    var iframes = window.parent.document.getElementsByTagName('iframe');
    for(var i=iframes.length; i-->0;){
        var _iframe = iframes[i];
        try{
            var idoc= 'contentDocument' in _iframe? _iframe.contentDocument : _iframe.contentWindow.document;
        }catch(e){
            continue;
        }
        if(idoc===document){
            iframe = _iframe;
            break;
        }
    }

    this.MakeToolbars();
    this.MakeFileTree();
    
    /** Resize Event */
    setInterval(function(){
        if(context.ctab != null && context.ctab.wrap.is(':visible')){
            var d = context.ctab.wrap.width() + '-' + context.ctab.wrap.height();
            if(context.ctab.wrap.dimension != d){
                context.ctab.Refresh();
                context.ctab.wrap.dimension = d;
            }
        }
    }, 250);

    /** File Tabs */
    $('#file-tabs').tabs({
        //tabTemplate: "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close'>Close</span></li>",
        show: function(event, ui){
            if($(ui.panel).data('codepadtab') != null){
                context.ctab = $(ui.panel).data('codepadtab');
                context.ctab.Refresh();
            }
        }
    });

    /** Layout */
    $('#layout').layout({
        closable: false,
        resizable: false,
        slidable: false,

        north__spacing_open: 1,
        north__size: 30,

        south__spacing_open: 1,
        south__size: 25,

        west__slidable: true,
        west__resizable: true,
        west__closable: true,
        west__minSize: 200
    });

    $('#test').layout({
        closable: false,
        resizable: false,
        slidable: false,

        north__size: 25,
        north__spacing_open: 0
    });
};