import React, { Component } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  LayoutAnimation,
  UIManager
 } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width,
      SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

class Deck extends Component {

  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {},
    renderNoMoreCards: () => {}
  };

  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        const { dx, dy } = gesture;
        position.setValue({ x: dx, y: dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if(gesture.dx > SWIPE_THRESHOLD) {
          this._forceSwipe(1);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this._forceSwipe(-1);
        } else {
          this._resetPosition();
        }

      }
    });

    this.state = { panResponder, position, index: 0 };

  }

  componentWillReceiveProps(nextProps) {
    //compares memory address
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  }

  componentWillUpdate() {
    //next line is only for android phones
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();
  }

  _forceSwipe(modifier) {
    Animated.timing(this.state.position, {
      toValue: { x: SCREEN_WIDTH*modifier, y: 0 },
      duration: 250
    }).start(() => this._prepareNextCard(modifier));
  }

  _prepareNextCard(direction) {
    const { onSwipeRight, onSwipeLeft, data } = this.props;
    const item = data[this.state.index];

    direction === 1 ? onSwipeRight(item) : onSwipeLeft(item);
    this.state.position.setValue({ x: 0, y: 0 });
    this.setState({ index: this.state.index+1 });

  }

  _resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { x: 0, y: 0 }
    }).start();
  }

  _getCardStyle() {
    const { position } = this.state;
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-120deg', '0deg', '120deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  }

  _renderCards() {

    if(this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards();
    }

    const toReturn = this.props.data.map((item, i) => {
      if(i < this.state.index) { return null; }
      if(i === this.state.index) {
        return (
          <Animated.View
            key={item.id}
            style={[this._getCardStyle(), styles.cardStyle, { zIndex: 99 }]}
            {...this.state.panResponder.panHandlers}
            >
              {this.props.renderCard(item)}
            </Animated.View>
        );
      } else {
        return (
          <Animated.View
            key={item.id}
            style={[styles.cardStyle, { top: 10*i, zIndex: 5 }]}>
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }
    }).reverse();

    return toReturn;
  }

  render() {

    return (
      <View>
        {this._renderCards()}
      </View>
    );
  }

}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH
  }
}


export default Deck;
