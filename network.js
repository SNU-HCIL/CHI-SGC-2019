import * as tf from '@tensoflow/tfjs';

/**
 * Fully connected single output network using TensorFlow.js.
 * Changing any of the parameters will RESET the model and LOSE all previous training.
 */
class Network {
    /**
     * Constructor for Network class. Output size is always 1 with linear activation.
     * @param {number} inputSize Number of cells for the input layer.
     * @param {number[]} layout Array containing the cell numbers for each hidden layer. If no hidden layers, pass an empty array.
     * @param {string} activation Name of the activation function to be used. Applies to all hidden layers.
     * @param {string} loss Name of the loss function to be used. 
     * @param {string} optimizer Name of the optimizer to be used.
     * @param {number} batchSize Number of training data to be collected before actual training.
     */
    constructor(inputSize, layout, activation='relu', loss='mse', optimizer='adam', batchSize=10) {
        this._training_x = [];
        this._training_y = [];
        this._batchSize = batchSize;
        this._activation = activation;
        this._loss = loss;
        this._optimizer = optimizer;

        this._inputSize = inputSize;
        this._layout = layout;
        this._numLayers = layout.length;

        this.reset();
    }

    /**
     * Recreates and recompiles the model using stored parameters.
     * Flushes out any unused training data as well.
     */
    reset() {
        let model = tf.sequential();
        model.add(tf.input({shape: [this._inputSize]}));
        for (let i=0; i < this._numLayers; i++) {
            model.add(tf.layers.dense({units: this._layout[i], activation: this._activation}));
        }
        model.add(tf.layers.dense({units: 1, activation: 'linear'}));
        model.compile(loss=this._loss, optimizer=this._optimizer, metrics=['mae']);
        this._model = model;

        this._training_x = [];
        this._training_y = [];
    }

    /**
     * Returns output prediction for a single input array.
     * @param {number[]} x Input data. Must be of length inputSize.
     * @return {number}
     */
    predict(x) {
        return this._model.predict(tf.tensor(x)).arraySync()[0];
    }

    /**
     * Trains the model using given input data to fit the target value.
     * Waits until batchSize number of data is stacked before actually training.
     * @param {number[]} x Input data. Must be of length inputSize.
     * @param {number} y Target value
     */
    train(x, y) {
        this._training_x.push(x);
        this._training_y.push(y);

        if (this._training_x.length === this._batchSize) {
            this._model.fit(tf.tensor(this._training_x), tf.tensor(this._training_y), {
                epochs: 1,
                batchSize: 10,
                verbose = 0
            });
            this._training_x = [];
            this._training_y = [];
        }
    }

    get inputSize() {
        return this._inputSize;
    }

    get layout() {
        return this._layout;
    }

    get batchSize() {
        return this._batchSize;
    }

    get numLayers() {
        return this._numLayers;
    }

    get activation() {
        return this._activation;
    }

    get loss() {
        return this._loss;
    }

    get optimizer() {
        return this._optimizer;
    }

    set inputSize(size) {
        this._inputSize = size;
        this.reset();
    }

    set layout(layout) {
        this._layout = layout;
        this._numLayers = layout.length;
        this.reset();
    }

    set batchSize(size) {
        this._batchSize = size;
        this.reset();
    }

    set activation(name) {
        this._activation = name;
        this.reset();
    }

    set loss(name) {
        this._loss = name;
        this.reset();
    }

    set optimizer(name) {
        this._optimizer = name;
        this.reset();
    }
}