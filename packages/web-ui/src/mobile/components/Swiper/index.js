import React, { Component } from 'react';
import { Swiper, Slide } from 'react-dynamic-swiper'
import 'react-dynamic-swiper/lib/styles.css'


class SwiperView extends Component {
  constructor(props) {
    super(props);
    this.options = {
      navigation: false,
      pagination: false,
      scrollBar: false,
    };
  }

  onInitSwiper(swiper) {
    if(this.props.onInitSwiper) {
      this.props.onInitSwiper(swiper)
    }
  }

  render() {
    const { recordList, renderItem } = this.props;
    return(
      <Swiper {...this.options} onInitSwiper={(swiper) => this.onInitSwiper(swiper)}>
        {
          recordList.map((record, i) => (
            <Slide key={i} onActive={swiper => this.props.onActive(recordList[swiper.activeIndex], swiper)}>
              { renderItem(record) }
            </Slide>
          ))
        }
      </Swiper>
    );
  }
}

export default SwiperView;
