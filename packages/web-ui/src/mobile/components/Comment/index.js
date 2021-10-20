import React, { Component } from 'react';
import CardView from '../CardView';
import moment from 'moment';
import classNames from 'classnames';
import { translate } from '../../locale';
import './index.css';
import { Icon } from 'react-onsenui';

const userColor = {};
const colors = [
  '#795548', '#FF5722', '#CDDC39', '#8BC34A', '#03A9F4', '#00BCD4', '#009688', '#2196F3', '#3F51B5', '#F44336', '#9C27B0'
];


class CommentStream extends Component {

  getUserColor(userId) {
    if (userColor[userId]) return userColor[userId];
    const no = Math.round(Math.random() * 10) % colors.length;
    return userColor[userId] = colors[no];
  }

  render() {
    const { all, limit, total, offset, onChange, value, userId } = this.props
    return (
      <div>
        {
          all.map((item, index) => {
            let obj = item.type === 'notification' ? JSON.parse(item.body) : '';
            return <CardView key={index}>
              <div className="comment-container">
                <span className='comment-tag' style={{ backgroundColor: this.getUserColor(item.author && item.author.id) }}>{item.$author && item.$author.fullName && item.$author.fullName.charAt(0)}</span>
                <span style={{ display: 'flex', flex: 1, flexDirection: 'column', paddingLeft: 20 }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ display: 'flex', flex: 1 }}>
                      <span>{item.$author && item.$author.fullName}</span>
                      <span style={{ color: '#D3D3D3', paddingLeft: '5px' }}> - {moment(item.$eventTime).format('DD/MM h:mm')} </span>
                    </div>
                    {
                      item.$author.id === userId &&
                      <span style={{ fontSize: '14px', marginTop: '-5px' }} onClick={() => this.props.removeComment(item)} >
                        <Icon icon="fa-times" />

                      </span>
                    }
                  </div>

                  {
                    obj ?
                      <React.Fragment>
                        <span style={{ fontWeight: 600 }}>{obj.title}</span>
                        <ul style={{ paddingLeft: 20 }}>
                          {
                            obj.tracks.map((i, ind) => (
                              <li key={ind}>
                                {
                                  i.displayValue ?
                                    <div>
                                      <span style={{ fontWeight: 600 }}>{i.title} : </span>
                                      <span>{i.oldDisplayValue && i.oldDisplayValue + ' » '} {i.displayValue}</span>
                                    </div>
                                    :
                                    <div>
                                      <span style={{ fontWeight: 600 }}>{i.title} : </span>
                                      <span>{i.oldValue && i.oldValue + ' » '} {i.value}</span>
                                    </div>
                                }
                              </li>
                            ))
                          }
                        </ul>
                      </React.Fragment>
                      :
                      <span style={{ textOverflow: 'ellipsis', wordBreak: 'break-word' }}>{item.body}</span>
                  }
                </span>
              </div>
            </CardView>
          })
        }
        {
          limit + offset < total &&
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className='comment-load' onClick={() => this.props.loadComment()}> Load more</span>
          </div>
        }

        {
          this.props.visible &&
          <div className='comment-input-container'>
            <input
              className="comment-input"
              placeholder={translate('Message.commentPlaceholder')}
              value={value}
              onChange={(e => onChange(e))}
            />
            <span className={classNames(value ? 'comment-btn-active' : 'comment-btn-disable')} onClick={() => value && this.props.addComment()}>{translate('Message.comment')}</span>
          </div>

        }
      </div>
    )
  }
}
export default CommentStream;

