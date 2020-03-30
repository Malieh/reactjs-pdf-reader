"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var styles = require("./index.less");
var pdfjsLib = require("pdfjs-dist");
// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.550/pdf.worker.js";
// the default params
var DEFAULT_DESIRE_WIDTH = 980;
var DEFAULT_SCALE = 1;
var PDFReader = /** @class */ (function (_super) {
    __extends(PDFReader, _super);
    function PDFReader(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            pdf: null,
            style: null,
            page: 1,
            totalPage: 0,
            premium: false,
            connected: false,
        };
        _this.canvas = React.createRef();
        return _this;
    }
    PDFReader.prototype.componentDidMount = function () {
        var _this = this;
        var _a = this.props, url = _a.url, data = _a.data, showAllPage = _a.showAllPage, onDocumentComplete = _a.onDocumentComplete, getPageNumber = _a.getPageNumber;
        var dom = this.canvas.current;
        if (url) {
            var obj = {
                url: null
            };
            // fetch pdf and render
            if (typeof url === "string") {
                obj.url = url;
            }
            else if (typeof url === "object") {
                obj = url;
            }
            pdfjsLib.getDocument(obj).then(function (pdf) {
                // is exit onDocumentComplete or not
                if (!showAllPage) {
                    if (onDocumentComplete) {
                        _this.props.onDocumentComplete(pdf.numPages);
                    }
                }
                _this.setState({ totalPage: pdf.numPages });
                _this.setState({ pdf: pdf }, function () {
                    if (showAllPage) {
                        _this.renderAllPage();
                    }
                    else {
                        _this.renderPage(dom, null);
                    }
                });
            });
        }
        else {
            // loaded the base64
            var loadingTask = pdfjsLib.getDocument({ data: data });
            loadingTask.promise.then(function (pdf) {
                // is exit onDocumentComplete or not
                if (!showAllPage) {
                    if (onDocumentComplete) {
                        _this.props.onDocumentComplete(pdf.numPages);
                    }
                }
                _this.setState({ pdf: pdf }, function () {
                    if (showAllPage) {
                        _this.renderAllPage();
                    }
                    else {
                        _this.renderPage(dom, null);
                    }
                });
            });
        }
    };
    PDFReader.getDerivedStateFromProps = function (props, state) {
        var pageScroll = props.pageScroll, pdfDiv = props.pdfDiv;
        if (pdfDiv && (pageScroll || pageScroll === 0)) {
            var elmnt = document.querySelector("#" + pdfDiv).querySelector("#my-pdf").querySelector('#div-pdf-' + pageScroll);
            if (elmnt) {
                elmnt.scrollIntoView();
            }
        }
        return __assign(__assign({}, state), { page: props.page });
    };
    // in the new lifestyle we can use this in shouldComponentUpdate
    PDFReader.prototype.shouldComponentUpdate = function (nextProps, nextState) {
        var pdf = this.state.pdf;
        var showAllPage = nextProps.showAllPage;
        var dom = this.canvas.current;
        if (showAllPage)
            return true;
        if (nextProps.page !== this.state.page) {
            this.renderPage(dom, nextProps.page);
        }
        return true;
    };
    PDFReader.prototype.renderPage = function (dom, spnum) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var _a = self.state, pdf = _a.pdf, page = _a.page;
            var _b = self.props, width = _b.width, scale = _b.scale, showAllPage = _b.showAllPage;
            var currentPage = page || 1;
            if (spnum) {
                currentPage = spnum;
            }
            if (currentPage > pdf.numPages) {
                currentPage = pdf.numPages;
            }
            if (currentPage < 1) {
                currentPage = 1;
            }
            pdf.getPage(currentPage).then(function (page) {
                var desiredWidth;
                // if this.props has width props
                if (width) {
                    desiredWidth = width;
                }
                else {
                    desiredWidth = DEFAULT_DESIRE_WIDTH;
                }
                var desireScale;
                // if this.props has scale props
                if (scale) {
                    desireScale = scale;
                }
                else {
                    var templeView = page.getViewport(DEFAULT_SCALE);
                    desireScale = desiredWidth / templeView.width;
                }
                var viewport = page.getViewport(desireScale);
                var canvas = dom;
                var canvasContext = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                if (showAllPage) {
                    self.setState({
                        style: {
                            height: 'auto',
                            width: canvas.width
                        }
                    });
                }
                else {
                    self.setState({
                        style: {
                            height: canvas.height,
                            width: canvas.width
                        }
                    });
                }
                var renderContext = {
                    canvasContext: canvasContext,
                    viewport: viewport
                };
                page.render(renderContext).promise.then(function () {
                    resolve(true);
                });
            });
        });
    };
    PDFReader.prototype.renderAllPage = function () {
        var self = this;
        var _a = this.state, pdf = _a.pdf, totalPage = _a.totalPage, premium = _a.premium, connected = _a.connected;
        var _b = this.props, width = _b.width, scale = _b.scale, onDocumentComplete = _b.onDocumentComplete;
        if (totalPage > 0) {
            var proArr = [];
            if (premium && connected) {
                for (var i = 1; i <= totalPage; i++) {
                    var dom = this["canvas" + i];
                    proArr.push(this.renderPage(dom, i));
                }
            }
            else {
                var pagesToShow = totalPage / 20;
                for (var i = 1; i <= pagesToShow; i++) {
                    var dom = this["canvas" + i];
                    proArr.push(this.renderPage(dom, i));
                }
            }
            Promise.all(proArr).then(function (values) {
                if (onDocumentComplete) {
                    self.props.onDocumentComplete(pdf.numPages);
                }
            });
        }
    };
    PDFReader.prototype.getCurrentPageNumber = function (page) {
        var getPageNumber = this.props.getPageNumber;
        if (getPageNumber) {
            this.props.getPageNumber(page);
        }
    };
    PDFReader.prototype.getPageScroll = function (page) {
        var pageScroll = this.props.pageScroll;
        if (pageScroll) {
            var elmnt = document.getElementById('div-pdf-' + page);
            elmnt.scrollIntoView();
        }
    };
    PDFReader.prototype.render = function () {
        var _this = this;
        var _a = this.state, style = _a.style, totalPage = _a.totalPage;
        var showAllPage = this.props.showAllPage;
        var tempArr = new Array(totalPage);
        tempArr.fill(0);
        return (React.createElement("div", { id: "my-pdf", style: style, className: styles["pdf__container"] }, showAllPage ? React.createElement(React.Fragment, null, tempArr.map(function (item, i) {
            var index = i + 1;
            return (React.createElement("div", { className: "react-pdf__Page", "data-page-number": index + "", id: "div-pdf-" + index, key: "div-" + index, onClick: _this.getCurrentPageNumber.bind(_this, index) },
                React.createElement("canvas", { ref: function (canvas) { _this["canvas" + index] = canvas; }, key: index + "", id: "canvas-pdf-" + index, "data-page": index + "", className: "canvaspdf" })));
        }))
            :
                React.createElement("canvas", { ref: this.canvas })));
    };
    return PDFReader;
}(React.Component));
exports.PDFReader = PDFReader;
//# sourceMappingURL=index.js.map