Network, Learning Agent, Game은 모두 JS로 구현해야 함 (node.js 아님)

## Network

class Network

- constructor([3, 4]) : 첫번째 레이어 3, 두번째 레이어 4, 마지막 레이어 1인 네트워크를 만든다
- eval(f: 길이 3인 배열): 네트워크 돌리고 결과 돌려줌 (숫자 1개)
- train(f: 길이 3인 배열, y: 참값): 네트워크 돌리고 y로부터 back prop
- render(): 네트워크 그림을 `<canvas>`나 `<svg>`로 그려서 뱉는다



## Learning Agent

class LearningAgent

- constructor(network: Network, game: Game)
- start(): 강화학습 한 번 하고 결과 점수 리턴
- stop(): 유사시 강종



## Game

- action_space
- state_space
- feature_function: list of features
  - feature: (state, action) -> number
- start(): 새 게임 시작
- step(action)
- render(): 게임 현재 화면을 `<canvas>`나 `<svg>`로 그려서 뱉는다



## UI

이거 빼고 다
