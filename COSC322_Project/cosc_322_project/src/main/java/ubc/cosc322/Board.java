package ubc.cosc322;

import java.util.ArrayList;

public class Board {

    private int[][] board;

    public Board(ArrayList<Integer> gameState) {

        board = new int[11][11];

        for (int row = 1; row <= 10; row++) {

            for (int col = 1; col <= 10; col++) {

                int value = gameState.get((row * 11) + col);
                board[row][col] = value;
            }
        }
    }

    public Board(Board oldBoard) {
        this.board = new int[11][11];
        for (int i = 0; i < 11; i++) {
            System.arraycopy(oldBoard.board[i], 0, this.board[i], 0, 11);
        }
    }

    public boolean isOccupied(int x, int y) {
        return board[x][y] != 0;
    }

    public int getValue(int x, int y) {
        return board[x][y];
    }

    public void updateBoard(int oldQX, int oldQY, int newQX, int newQY,int arrowX, int arrowY) {
        int queenValue = board[oldQX][oldQY];
        board[oldQX][oldQY] = 0;
        board[newQX][newQY] = queenValue;
        board[arrowX][arrowY] = 3;
    }

    public void moveQueen(int oldQX, int oldQY, int newQX, int newQY) {
        int queenValue = board[oldQX][oldQY];
        board[oldQX][oldQY] = 0;
        board[newQX][newQY] = queenValue;
    }

    public void placeArrow(int arrowX, int arrowY) {
    board[arrowX][arrowY] = 3;
}
}