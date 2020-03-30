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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var CSSModules = require("react-css-modules");
var styles = require("./index.less");
var pdfjsLib = require("pdfjs-dist");
var pdfjsViewer = require("../../../node_modules/pdfjs-dist/web/pdf_viewer.js");
// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.550/pdf.worker.js";
// default scale
var DEFAULT_MIN_SCALE = 0.25;
var DEFAULT_MAX_SCALE = 10.0;
var USE_ONLY_CSS_ZOOM = true;
var TEXT_LAYER_MODE = 0; // DISABLE
var MAX_IMAGE_SIZE = 1024 * 1024;
var CMAP_PACKED = true;
var DEFAULT_URL = "/test.pdf";
var DEFAULT_SCALE_DELTA = 1.1;
var MIN_SCALE = DEFAULT_MIN_SCALE;
var MAX_SCALE = DEFAULT_MAX_SCALE;
var DEFAULT_SCALE_VALUE = "auto"; // in order to be responsive
var MobilePDFReader = /** @class */ (function (_super) {
    __extends(MobilePDFReader, _super);
    function MobilePDFReader(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            currentPageNumber: 1,
            currentScaleValue: "auto",
            totalPage: null,
            title: ""
        };
        _this.zoomIn = function (ticks) {
            var newScale = _this.pdfViewer.currentScale;
            do {
                newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
                newScale = Math.ceil(newScale * 10) / 10;
                newScale = Math.min(MAX_SCALE, newScale);
            } while (--ticks && newScale < MAX_SCALE);
            _this.pdfViewer.currentScaleValue = newScale;
        };
        _this.zoomOut = function (ticks) {
            var newScale = _this.pdfViewer.currentScale;
            do {
                newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
                newScale = Math.floor(newScale * 10) / 10;
                newScale = Math.max(MIN_SCALE, newScale);
            } while (--ticks && newScale > MIN_SCALE);
            _this.pdfViewer.currentScaleValue = newScale;
        };
        _this.pageAdd = function () {
            if (_this.pdfViewer.currentPageNumber > _this.pdfDocument.numPages) {
                return;
            }
            _this.pdfViewer.currentPageNumber++;
        };
        _this.pageDelete = function () {
            if (_this.pdfViewer.currentPageNumber < 1) {
                return;
            }
            _this.pdfViewer.currentPageNumber--;
        };
        _this.pdfLoadingTask = null;
        _this.pdfDocument = null;
        _this.pdfViewer = {
            currentScaleValue: null
        },
            _this.pdfHistory = null;
        _this.pdfLinkService = null;
        _this.container = React.createRef();
        return _this;
    }
    Object.defineProperty(MobilePDFReader.prototype, "pagesCount", {
        get: function () {
            return this.pdfDocument.numPages;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MobilePDFReader.prototype, "page", {
        get: function () {
            if (this.pdfViewer != null) {
                return this.pdfViewer.currentPageNumber;
            }
            else {
                return 1;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MobilePDFReader.prototype, "loadingBar", {
        get: function () {
            var bar = new pdfjsViewer.ProgressBar("#loadingBar", {});
            return pdfjsLib.shadow(this, "loadingBar", bar);
        },
        enumerable: true,
        configurable: true
    });
    MobilePDFReader.prototype.open = function (params) {
        var url = params.url;
        var self = this;
        this.setTitleUsingUrl(url);
        // Loading document.
        var loadingTask = pdfjsLib.getDocument({
            url: url,
            withCredentials: true,
            maxImageSize: MAX_IMAGE_SIZE,
            cMapPacked: CMAP_PACKED
        });
        this.pdfLoadingTask = loadingTask;
        loadingTask.onProgress = function (progressData) {
            self.progress(progressData.loaded / progressData.total);
        };
        return loadingTask.promise.then(function (pdfDocument) {
            // Document loaded, specifying document for the viewer.
            self.pdfDocument = pdfDocument;
            self.pdfViewer.setDocument(pdfDocument);
            self.pdfLinkService.setDocument(pdfDocument);
            self.pdfHistory.initialize(pdfDocument.fingerprint);
            self.loadingBar.hide();
            self.setTitleUsingMetadata(pdfDocument);
        }, function (exception) {
            var message = exception && exception.message;
            var l10n = self.l10n;
            var loadingErrorMessage;
            if (exception instanceof pdfjsLib.InvalidPDFException) {
                // change error message also for other builds
                loadingErrorMessage = l10n.get('invalid_file_error', null, 'Invalid or corrupted PDF file.');
            }
            else if (exception instanceof pdfjsLib.MissingPDFException) {
                // special message for missing PDFs
                loadingErrorMessage = l10n.get('missing_file_error', null, 'Missing PDF file.');
            }
            else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
                loadingErrorMessage = l10n.get('unexpected_response_error', null, 'Unexpected server response.');
            }
            else {
                loadingErrorMessage = l10n.get('loading_error', null, 'An error occurred while loading the PDF.');
            }
            loadingErrorMessage.then(function (msg) {
                //console.log(msg)
            });
            self.loadingBar.hide();
        });
    };
    MobilePDFReader.prototype.setTitleUsingUrl = function (url) {
        var title = pdfjsLib.getFilenameFromUrl(url) || url;
        try {
            title = decodeURIComponent(title);
        }
        catch (e) {
            // decodeURIComponent may throw URIError,
            // fall back to using the unprocessed url in that case
        }
        this.setTitle(title);
    };
    MobilePDFReader.prototype.setTitleUsingMetadata = function (pdfDocument) {
        var self = this;
        return pdfDocument.getMetadata().then(function (data) {
            var info = data.info;
            var metadata = data.metadata;
            self.documentInfo = info;
            self.metadata = metadata;
            // Provides some basic debug information
            // console.log("PDF " + pdfDocument.fingerprint + " [" +
            //             info.PDFFormatVersion + " " + (info.Producer || "-").trim() +
            //             " / " + (info.Creator || "-").trim() + "]" +
            //             " (PDF.js: " + (pdfjsLib.version || "-") + ")");
            var pdfTitle;
            if (metadata && metadata.has("dc:title")) {
                var title = metadata.get("dc:title");
                // Ghostscript sometimes returns 'Untitled', so prevent setting the
                // title to 'Untitled.
                if (title !== "Untitled") {
                    pdfTitle = title;
                }
            }
            if (!pdfTitle && info && info["Title"]) {
                pdfTitle = info["Title"];
            }
            if (pdfTitle) {
                self.setTitle(pdfTitle + " - " + document.title);
            }
            return { title: pdfTitle, documentInfo: info };
        });
    };
    MobilePDFReader.prototype.setTitle = function (title) {
        this.setState({ title: title });
    };
    MobilePDFReader.prototype.progress = function (level) {
        var percent = Math.round(level * 100);
        // Updating the bar if value increases.
        if (percent > this.loadingBar.percent || isNaN(percent)) {
            this.loadingBar.percent = percent;
        }
    };
    MobilePDFReader.prototype.initUI = function () {
        var linkService = new pdfjsViewer.PDFLinkService();
        var self = this;
        var _a = self.props, scale = _a.scale, page = _a.page, onDocumentComplete = _a.onDocumentComplete;
        this.pdfLinkService = linkService;
        this.l10n = pdfjsViewer.NullL10n;
        var container = this.container.current;
        var pdfViewer = new pdfjsViewer.PDFViewer({
            container: container,
            linkService: linkService,
            l10n: this.l10n,
            useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
            textLayerMode: TEXT_LAYER_MODE
        });
        this.pdfViewer = pdfViewer;
        linkService.setViewer(pdfViewer);
        this.pdfHistory = new pdfjsViewer.PDFHistory({
            linkService: linkService
        });
        linkService.setHistory(this.pdfHistory);
        container.addEventListener("pagesinit", function () {
            // We can use pdfViewer now, e.g. let's change default scale.
            // deal with the init page in the props
            if (scale) {
                DEFAULT_SCALE_VALUE = scale;
            }
            if (page) {
                pdfViewer.currentPageNumber = page;
            }
            pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
            self.setState({ totalPage: self.pdfDocument.numPages });
        });
        container.addEventListener("pagechange", function (evt) {
            var page = evt.pageNumber;
            self.setState({ currentPageNumber: page });
        });
    };
    MobilePDFReader.prototype.componentDidMount = function () {
        var _a = this.props, url = _a.url, minScale = _a.minScale, maxScale = _a.maxScale;
        // deal with the props if include minScale or maxScale
        if (minScale) {
            MIN_SCALE = minScale;
        }
        if (maxScale) {
            MAX_SCALE = maxScale;
        }
        this.initUI();
        this.open({
            url: url
        });
    };
    MobilePDFReader.prototype.render = function () {
        var title = this.state.title;
        var _a = this.props, isShowHeader = _a.isShowHeader, isShowFooter = _a.isShowFooter;
        var showHeader = true;
        var showFooter = true;
        if (isShowHeader !== undefined) {
            showHeader = isShowHeader;
        }
        if (isShowFooter !== undefined) {
            showFooter = isShowFooter;
        }
        return React.createElement("div", { className: 'mobile__pdf__container' },
            showHeader && React.createElement("header", { className: "mobile__pdf__container__header" }, title),
            React.createElement("div", { id: "viewerContainer", ref: this.container },
                React.createElement("div", { id: "viewer", className: "pdfViewer" })),
            React.createElement("div", { id: "loadingBar" },
                React.createElement("div", { className: "progress" }),
                React.createElement("div", { className: "glimmer" })),
            React.createElement("div", { id: "errorWrapper", hidden: true },
                React.createElement("div", { id: "errorMessageLeft" },
                    React.createElement("span", { id: "errorMessage" }),
                    React.createElement("button", { id: "errorShowMore" }, "More Information"),
                    React.createElement("button", { id: "errorShowLess" }, "Less Information")),
                React.createElement("div", { id: "errorMessageRight" },
                    React.createElement("button", { id: "errorClose" }, "Close")),
                React.createElement("div", { className: "clearBoth" }),
                React.createElement("textarea", { id: "errorMoreInfo", hidden: true, readOnly: true })),
            showFooter && React.createElement("footer", null,
                React.createElement("button", { className: "toolbarButton pageUp", title: "Previous Page", id: "previous", onClick: this.pageDelete }),
                React.createElement("button", { className: "toolbarButton pageDown", title: "Next Page", id: "next", onClick: this.pageAdd }),
                React.createElement("input", { type: "number", id: "pageNumber", className: "toolbarField pageNumber", value: this.state.currentPageNumber, size: 4, min: 1 }),
                React.createElement("button", { className: "toolbarButton zoomOut", title: "Zoom Out", id: "zoomOut", onClick: this.zoomOut }),
                React.createElement("button", { className: "toolbarButton zoomIn", title: "Zoom In", id: "zoomIn", onClick: this.zoomIn })));
    };
    MobilePDFReader = __decorate([
        CSSModules(styles)
    ], MobilePDFReader);
    return MobilePDFReader;
}(React.Component));
exports.MobilePDFReader = MobilePDFReader;
//# sourceMappingURL=index.js.map