# ToDo:

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

- 팩맨으로하는게 좋을듯?
  - 지금은 pacman, ghost, food만 맵에 있는걸로?
  - ghost들은 지금은 멍청해도 괜찮 (랜덤으로 돌아다닌다거나 무조건 pacman만 잡을려 하거나)
    - 2마리 정도?
  - rewards:
    - eat one food = 10
    - eat all the food = 100 (game done)
    - get killed by a ghost = -50 (game over)
    - -1 for each turn
  - list of features:
    - player position
    - food positions
    - number of foods
    - ghost positions
    - number of ghosts
    - distance to the closest food (euclidian and maze distances)
    - inverse of distance to closest food (1 if distance is 0)
    - distance to the closest ghost (euclidian and maze distances)
    - inverse of distance to closest ghost (1 if distance is 0)
    - distance to the other ghost (euclidian and maze distances)
    - inverse of distance to the other ghost
    - 재량껏 추가해 주세요
  - 대략 이렇게 생긴 맵?:\
![alt text](https://github.com/SNU-HCIL/CHI-SGC-2019/blob/master/img/map.JPG)

## UI

위에 빼고 다
