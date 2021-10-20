import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default function enhanceScroller(PageComponent) {
  return class PageScroller extends PageComponent {
    static displayName = `HOC_(${getDisplayName(PageComponent)})`;

    constructor(props) {
      super(props);
      this.infiniteScroller = this.infiniteScroller.bind(this);
      this.checkScroller = debounce(this.checkScroller.bind(this), 50);
    }

    checkScroller() {
      const el = this._list;
      let { pager } = this.state;
      pager = {...pager, offset: pager.offset + pager.limit };
      const hasMore = pager.total > pager.offset;
      if (hasMore) {
        this.setState({ loading: true, pager: {...pager} }, () => {
          el.parentNode.scrollTop = el.parentNode.scrollTop + 150;
          this.fetchData();
        });
      }
    }

    infiniteScroller() {
      if (!this._list) {
        return;
      }
      this._list = ReactDOM.findDOMNode(this._list);
      const el = this._list;
      const offset = el.scrollHeight - el.parentNode.scrollTop - el.parentNode.clientHeight;

      if (this._listHook) {
        if (el.parentNode.scrollTop === 0) {
          this._listHook.enableHook();
        } else {
          this._listHook.disableHook();
        }
      }
      if (offset <= 100) {
        this.checkScroller();
      }
    }

    render() {
      return super.render();
    }
  }
}
