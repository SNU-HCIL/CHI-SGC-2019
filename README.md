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
- step(): 강화학습 한 번 하고 결과 점수 리턴
- reset(): 유사시 강종



## Game

- action_space
- state_space()
- state: current state
- feature_function(): all features (object type)
- feature_function(feature_name): one of the features
  - feature: (state, action) -> any
- reset(): 새 게임 시작. Returns state
- step(action): returns reward, done, new_state
- render(): 게임 현재 화면을 `<canvas>`나 `<svg>`로 그려서 뱉는다

- 팩맨으로 하는게 좋을 듯?
  - 지금은 Pacman, Ghost, Food만 맵에 있는걸로?
  - Pacman들은 한 명이라도 특정 방향으로 움직일 수 있으면, 그 방향으로 다같이 움직임
    - 원하는 수만큼 넣을 수 있음
  - Ghost들은 A* 알고리즘으로 다른 Ghost를 피해서 가장 가까운 Pacman을 최적 경로로 쫓아감
    - 원하는 수만큼 넣을 수 있음
  - rewards:
    - eat one food = 10
    - eat all the food = 100 (game done)
    - get killed by a ghost = -50 (game over)
    - ~~-1 for each turn~~
  - list of features:
    - `"pacmanPositions"`: (state) => list of `{x: ..., y: ...}`
    - `"foodPositions"`: (state) => list of `{x: ..., y: ...}`
    - `"numberOfFoods"`: (state) => number
    - `"ghostPositions"`: (state) => list of `{x: ..., y: ...}`
    - `"numberOfGhosts"`: (state) => number
    - `"distanceToTheClosestFoodInEuclidian"`: (state) => number (장애물 고려 X, float)
    - `"distanceToTheClosestFoodInManhattan"`: (state) => number (장애물 고려 X, int)
    - `"distanceToTheClosestFoodInChebyshev"`: (state) => number (장애물 고려 X, int)
    - `"distanceToTheClosestFoodInReal"`: (state) => number (장애물 고려 O, Ghost 고려 O, int)
    - `"inverseOfDistanceToTheClosestFoodInEuclidian"`: (state) => number (장애물 고려 X, float, infinity if distance is 0)
    - `"inverseOfDistanceToTheClosestFoodInManhattan"`: (state) => number (장애물 고려 X, int, infinity if distance is 0)
    - `"inverseOfDistanceToTheClosestFoodInChebyshev"`: (state) => number (장애물 고려 X, int, infinity if distance is 0)
    - `"inverseOfDistanceToTheClosestFoodInReal"`: (state) => number (장애물 고려 O, Ghost 고려 O, int, infinity if distance is 0)
    - `"distanceToTheClosestGhostInEuclidian"`: (state) => number (장애물 고려 X, float)
    - `"distanceToTheClosestGhostInManhattan"`: (state) => number (장애물 고려 X, int)
    - `"distanceToTheClosestGhostInChebyshev"`: (state) => number (장애물 고려 X, int)
    - `"distanceToTheClosestGhostInReal"`: (state) => number (장애물 고려 O, Ghost 고려 O, int)
    - `"inverseOfDistanceToTheClosestGhostInEuclidian"`: (state) => number (장애물 고려 X, float, infinity if distance is 0)
    - `"inverseOfDistanceToTheClosestGhostInManhattan"`: (state) => number (장애물 고려 X, int, infinity if distance is 0)
    - `"inverseOfDistanceToTheClosestGhostInChebyshev"`: (state) => number (장애물 고려 X, int, infinity if distance is 0)
    - `"inverseOfDistanceToTheClosestGhostInReal"`: (state) => number (장애물 고려 O, Ghost 고려 O, int, infinity if distance is 0)
    - `"whetherAFoodIsOnANeighboringSpace"`: (state) => boolean (Manhattan distance === 1?)
    - `"whetherAGhostIsOnANeighboringSpace"`: (state) => boolean (Manhattan distance === 1?)
    - `"canAPacmanDie"`: (state) => boolean (바로 다음 턴에 죽을 가능성이 0%보다 큰가?)
    - `"IsAPacmanDieWithAction"`: (state, action) => boolean (이렇게 행동하면 바로 다음 턴에 죽는가?)
    - 재량껏 추가해 주세요
  - 대략 이렇게 생긴 맵?:\
![alt text](https://github.com/SNU-HCIL/CHI-SGC-2019/blob/master/img/map.JPG)\
-시간 부족할거 같으면 훨씬 더 간단한 것도 괜찮. 예: Cart Pole

## UI

위에 빼고 다
