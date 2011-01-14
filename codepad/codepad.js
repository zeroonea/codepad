/*
 * CodePad 0.1-rc1
 *
 * Copyright (c) 2011 Nguyen Hung Tin (zeroonea.com)
 *
 * Dual licensed under the MIT and GPL licenses
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * $Date: 2011-01-11 8:32:54 +0700 $
 */

var CodePad = {

    opts : {
        tab_types: null,
        default_tab_type: null,
        files: null,
        toolbars: ['save,wrap,maximize'],
        load_files_callback: null,
        load_file_callback: null,
        save_file_callback: null,
        create_file_callback: null,
        delete_file_callback: null
    },

    buttons : {
        new_file: {
            title:'Create new file'
        },
        save: {
            title: 'Save current file',
            click: function(){
                CodePad.SaveCurrentFile();
            }
        },
        wrap: {
            title: 'Toggle word wrapping mode',
            click: function(){
                if(CodePad.ctab != null) CodePad.ctab.ToggleWordWrapping();
            }
        },
        maximize: {
            title: 'Toggle fullscreen mode',
            click: function(){
                CodePad.MM();
            }
        }
    },

    iframe : null,
    ctab : null,
    tabs : [],
    tabcount : 0,

    Init : function(opts){
        $.extend(true, this.opts, opts);

        /** Find iframe (in parent) */
        var iframes = window.parent.document.getElementsByTagName('iframe');
        for(var i=iframes.length; i-->0;){
            var _iframe = iframes[i];
            try{
                var idoc= 'contentDocument' in _iframe? _iframe.contentDocument : _iframe.contentWindow.document;
            }catch(e){
                continue;
            }
            if(idoc===document){
                this.iframe = _iframe;
                break;
            }
        }

        this.MakeToolbars();
        this.MakeFileTree();

        /** Resize Event */
        setInterval(function(){
            if(CodePad.ctab != null && CodePad.ctab.wrap.is(':visible')){
                var d = CodePad.ctab.wrap.width() + '-' + CodePad.ctab.wrap.height();
                if(CodePad.ctab.wrap.dimension != d){
                    CodePad.ctab.Refresh();
                    CodePad.ctab.wrap.dimension = d;
                }
            }
        }, 250);

        /** File Tabs */
        $('#file-tabs').tabs({
            tabTemplate: '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-close">Close</span></li>',
            show: function(event, ui){
                if($(ui.tab).parent().data('codepadtab') != null){
                    CodePad.ctab = $(ui.tab).parent().data('codepadtab');
                    CodePad.ctab.Refresh();
                }
            },
            add: function(event, ui){
                $(ui.tab).parent().data('codepadtab', CodePad.ctab);
            }
        });

        /** Layout */
        $(document.body).layout({
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

        return this;
    },

    TreeHtml : function(files, foldername){
        var html = '';
        for(var i in files){
            var file = files[i], child_html = '', name = '', path = '';
            if(typeof file == 'object'){
                /** Folder or File with extra settings */
                name = file.name
            }else{
                /** File */
                name = file;
            }
            path = (foldername != '' ? foldername + '/' : '') + name;
            
            if(file.files != null){
                child_html = this.TreeHtml(file.files, path);
            }

            var ext = child_html != '' ? 'folder' : this.GetFileExtension(name);
            var type = child_html != '' ? 'folder' : 'file';

            html += '<li class="'+ext+'" data-'+ type +'="'+path+'"><a href="javascript:void(0);">' + name + '</a>' + child_html + '</li>';
        }

        if(html != ''){
            return '<ul>' + html + '</ul>';
        }else return '';
    },

    MakeFileTree : function(){
        if(typeof this.opts.files == 'string' && this.opts.files != ''){
            this.files = eval('(' + this.opts.files + ')');
        }else if(typeof this.opts.files == 'object'){
            this.files = this.opts.files;
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
                    CodePad.LoadFile($(li).data('file'));
                });
            }
        });
    },

    LoadFile : function(file){
        if(this.opts.load_file_callback != null){
            if(this.tabs[file] == null){
                if(typeof this.opts.load_file_callback == 'string'){
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
    },

    OpenFile : function(file, content){
        var tabid = 'file-tabs-' + (this.tabcount++);
        var ext = this.GetFileExtension(file);

        /** Create new codepadtab */
        var tab_type = this.opts.tab_types[this.opts.default_tab_type];
        this.ctab = new tab_type.obj(tab_type.opts);

        /** Create new jquery-tab */
        var tab = $('<div id="'+tabid+'" style="height:100%"></div>');
        $('#codepad-holders').append(tab);
        $('#file-tabs').tabs('add', '#' + tabid, '<span class="ico16 '+ext+'"></span>&nbsp;' + this.GetFileName(file));
        $('#codepad-holders').append(tab);
        $('#file-tabs > ul').css('display', '');

        /** Display codepadtab in jquery-tab */
        this.ctab.Open(file, content, '#' + tabid);
        this.ctab.file = file;
        this.ctab.tabid = '#' + tabid;
        this.tabs[file] = this.ctab;

        $('#file-tabs').tabs('select', '#' + tabid)
            .find('.ui-tabs-nav').sortable('destroy').sortable({
                axis: "x"
            });

        /** Close file event */
        $('#file-tabs span.ui-icon-close').unbind('click').bind('click', function(){
            
            /** Remove codepadtab */
            CodePad.CloseFile($(this).parent().data('codepadtab').file);

            /** Manual remove jquery-tab */
            $($(this).parent().data('codepadtab').tabid).remove();
            $(this).parent().remove();

            /** TMP: Fix strange bug */
            $('#file-tabs').tabs('add', 'tmp-123', ' ').tabs('remove', $('#file-tabs').tabs('length') - 1);
            
            /** Select other tab */
            $('#file-tabs').tabs('select', $('#file-tabs').tabs('length') - 1);
        });

        $('#spinner').css('display', 'none');
    },

    ActiveFile : function(file){
        if(this.tabs[file] != null){
            this.ctab = this.tabs[file];
            $('#file-tabs').tabs('select', this.ctab.tabid);
        }
    },

    CloseFile : function(file){
        if(this.tabs[file] != null){
            this.tabs[file].Close();
            if(this.tabs[file] == this.ctab){
                this.ctab = null;
            }
            this.tabs[file] = null;
        }
    },

    SaveCurrentFile : function(){
        if(this.ctab != null && this.opts.save_file_callback != null){
            var text = this.ctab.Value();
            
            if(typeof this.opts.save_file_callback == 'string'){
                $('#spinner').css('display', '');
                window.parent[this.opts.save_file_callback](this.ctab.file, text, this);
            }else if(typeof this.opts.save_file_callback == 'function'){
                $('#spinner').css('display', '');
                this.opts.load_file_callback(this.ctab.file, text, this);
            }
        }
    },

    SaveAllFiles : function(){
        
    },

    GetFileExtension : function(file){
        return (/[.]/.exec(file)) ? /[^.]+$/.exec(file) + '' : '';
    },

    GetFileName : function(filepath){
        return (/[/]/.exec(filepath)) ? /[^/]+$/.exec(filepath) + '' : filepath;
    },

    MakeToolbars : function(){
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
    },

    MM : function(){
        if(this.iframe.maximize == null){
            $(window.parent.document.body).css('overflow', 'hidden');
            this.iframe.p_height = $(this.iframe).css('height');
            this.iframe.p_zindex = $(this.iframe).css('z-index');
            $(this.iframe).css({
                position: 'fixed', top: 0, left: 0,
                height: $(window.parent).height(),
                width: $(window.parent).width(),
                zIndex: 99999999
            });
            this.iframe.maximize = 1;
        }else{
            $(window.parent.document.body).css('overflow', '');
            $(this.iframe).css({
                position: '',
                height: this.iframe.p_height,
                width: '100%',
                zIndex: this.iframe.p_zindex
            });
            this.iframe.maximize = null;
        }
    },
    
    Error : function(msg, code){
        alert(msg);
        $('#spinner').css('display', 'none');
    },

    Success : function(msg, code){
        alert(msg);
        $('#spinner').css('display', 'none');
    }
};