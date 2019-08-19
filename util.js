/**
 * Class that holds utility functions.
 */
class Util {
    /**
     * Returns the argmax of given array. Should work with any iterable.
     * Code found at https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
     * @param {number[]} array
     * @return {number} Index of array element with the largest value
     */
    static argmax(array) {
        return [].map.call(array, (x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
    }

    /**
     * Returns the largest value of given array.
     * @param {number[]} array 
     * @return {number} Array element with the largest value
     */
    static max(array) {
        return Math.max.apply(Math, array);
    }
}