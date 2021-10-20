import React, { Component } from 'react';
import CommentList from '../components/Comment';
import { CardView, ManyToMany } from '../components';
import TabberView from '../components/Tabber';
import { debounceCallback } from '../pages/debounce';
import ons from 'onsenui';
import { translate } from '../locale';

export const RenderManyToOne = (props) => {
  const { name, fieldLabel, placeholder, targetName, value, searchAPI, className } = props;
  return (
    <CardView.ManyToOne
      {...props}
      style={{ width: '100%' }}
      name={name}
      className={`inline select-control ${className}`}
      title={fieldLabel}
      placeholder={placeholder}
      targetName={targetName}
      value={value}
      searchAPI={searchAPI}
      renderItem={(obj, i) =>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 0 }} className="field-input list-item list--inset__item list-item--chevron list-item--tappable">
            <div
              key={i}
              className="many-to-one"
            >
              {obj ? obj[targetName] : placeholder}
            </div>
          </div>
        </div>
      }
      onChange={(e) => props.onChange(e)}
    />
  )
}

export const RenderManyToMany = (props) => {
  const { name, fieldLabel, placeholder, targetName, value, searchAPI } = props;
  return (
    <CardView.ManyToMany
      {...props}
      style={{ width: '100%' }}
      name={name}
      className="inline select-control"
      title={fieldLabel}
      placeholder={placeholder}
      targetName={targetName}
      value={value}
      searchAPI={searchAPI}
      renderItem={(obj, i) =>
        <ManyToMany.Chip
          key={i}
          value={obj ? obj[targetName] : placeholder}
          onDelete={() => {
            const values = props.value;
            values.splice(i, 1);
            props.onChange({ target: { name, value: [...values] } });
          }}
        />
      }
      onChange={(e) => props.onChange(e)}
    />
  )
}

export const Tabs = ({ tabs, activeColor, activeTab, onChange, ...rest }) => (
  <TabberView>
    {
      tabs.map((item, index) => (
        <TabberView.Tab key={index}
          activeColor={activeColor}
          title={item.title}
          active={activeTab === item.value}
          onClick={() => onChange(item.value)}
          hideTab={item.hide ? item.hide() : false}
          {...rest}
        />
      ))
    }
  </TabberView>
);

export class PageCommentList extends Component {

  getApi() {
    return {}
  }

  getCurrentRecord() {
    return {}
  }

  getAllComment(limit, offset, record = this.getCurrentRecord()) {
    let { all } = this.state;
    const { message } = this.getApi();
    const { getAll } = message(record);
    getAll({ limit: limit, offset: offset })
      .then(({ data = [], total = 0 }) => {
        if (offset === 0) {
          all = data
        } else {
          all.push(...data)
        }
        this.setState({ all: [...all], total });
      });
  }

  addComment() {
    const { all = [], total = 0, commentMessage = '', offset = 0 } = this.state;
    const { message } = this.getApi();
    const { add } = message(this.getCurrentRecord());
    add(commentMessage)
      .then(res => {
        all.push(res.data[0])
        this.setState({ all: [...all], total: total + 1, commentMessage: '', offset: offset + 1 })
      })
  }

  removeComment(item) {
    console.log(item)
    let { all,total } =  this.state;
    const { message } = this.getApi();
    const { remove } = message(this.getCurrentRecord());
    ons.notification.confirm(translate('Alert.confirmCommentDelete'), { title: translate('Alert.confirm'), id: "remove-comment", buttonLabels: [translate('Alert.cancelButton'), translate('Alert.yesButton')] }).then(res => {
      if (res === 1) {
        remove(item).then(res => {
          if (res.status !== 0) {
            ons.notification.alert(res.error.title, { id: "comment-error" })
          } else {
            const { data } = res
            const targetIndex = all.findIndex(i => i.id === data[0].id)
            console.log("target Index",targetIndex)
            all.splice(targetIndex,1);
            console.log("all", all)
            this.setState({ all,total: total - 1 })
          }
        });
      }
    });
  }

  loadComment() {
    let { limit, offset } = this.state;
    offset = offset + 4;
    this.setState({
      offset,
      limit,
    }, () => this.getAllComment(limit, offset))
  }

  onRecordSwipe(record) {
    const { getRecordsByIndex } = this.props.route;
    if (getRecordsByIndex) {
      const list = getRecordsByIndex(record);
      this.setState({ recordList: list,offset: 0,total: 0,all: []}, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.fetchNewData(record)
        this.swiper.slideTo(targetIndex, 0, true);
      });
    }
    debounceCallback(() => {
      this.closeEdit().then(res => {
        this.fetchNewData(record);
      });
    });
  }

  renderCommentList() {
    const { all = [], commentMessage = '', limit = 4, total = 0, offset = 0 } = this.state;
    let api = this.getApi();
    const { info } = this.props.user_data.data;
    return (
      <CommentList
          {...({ all, limit, total, offset })}
          loadComment={() => this.loadComment()}
          onChange={(e) => this.setState({ commentMessage: e.target.value })}
          value={commentMessage}
          addComment={() => this.addComment()}
          visible={api.app_state.mode === 'online' ? true : false}
          removeComment={(i) => this.removeComment(i)}
          userId={info['user.id']}
      />
    );
  }

}

export default PageCommentList;
