package ubc.cosc322;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Map;

import ygraph.ai.smartfox.games.amazons.AmazonsGameMessage;

public class MoveGenerator {

    @SuppressWarnings("unchecked")
    public boolean checkLegalMove(Map<String, Object> msgDetails) {

        ArrayList<Integer> queenFrom = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.QUEEN_POS_CURR);
        ArrayList<Integer> queenTo   = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.QUEEN_POS_NEXT);
        ArrayList<Integer> arrowTo   = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.ARROW_POS);
        ArrayList<Integer> gameState = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.GAME_STATE);

        int startX = queenFrom.get(0);
        int startY = queenFrom.get(1);
        int endX   = queenTo.get(0);
        int endY   = queenTo.get(1);
        int arrowX = arrowTo.get(0);
        int arrowY = arrowTo.get(1);

        Board gameBoard = new Board(gameState);
        boolean legalMove = queenLegalMove(startX, startY, endX, endY, gameBoard);

        if (!legalMove) return false;

        return shootingLegalMove(endX, endY, arrowX, arrowY, gameBoard);
    }

    public boolean queenLegalMove(int startX, int startY, int endX, int endY, Board gameState) {
        boolean legalMove = checkMoveInLine(startX, startY, endX, endY);
        if (legalMove) {
            legalMove = checkPathClear(startX, startY, endX, endY, gameState);
        }
        return legalMove;
    }

    public boolean checkMoveInLine(int startX, int startY, int endX, int endY) {
        if (startX == endX || startY == endY) return true;
        return Math.abs(startX - endX) == Math.abs(startY - endY);
    }

    public boolean checkPathClear(int startX, int startY, int endX, int endY, Board currentGameState) {
        int moveDistance = Math.max(Math.abs(startX - endX), Math.abs(startY - endY));
        int[][] moveLine = new int[moveDistance + 1][2];

        int stepX = Integer.signum(endX - startX);
        int stepY = Integer.signum(endY - startY);
        for (int i = 0; i <= moveDistance; i++) {
            moveLine[i][0] = startX + i * stepX;
            moveLine[i][1] = startY + i * stepY;
        }

        return comparePoints(moveLine, currentGameState);
    }

    public boolean comparePoints(int[][] moveLine, Board gameState) {
        // Start at index 1 to skip the source square; destination is included.
        for (int i = 1; i < moveLine.length; i++) {
            if (gameState.isOccupied(moveLine[i][0], moveLine[i][1])) return false;
        }
        return true;
    }

    public boolean shootingLegalMove(int startX, int startY, int endX, int endY, Board gameState) {
        boolean legalMove = checkMoveInLine(startX, startY, endX, endY);
        if (legalMove) {
            legalMove = checkPathClear(startX, startY, endX, endY, gameState);
        }
        return legalMove;
    }

    public void getLegalMoves(Board gameState, int playerColor) {
        getLegalMoves(gameState, playerColor, "legal_moves.json");
    }

    public void getLegalMoves(Board gameState, int playerColor, String outputFilePath) {
        int queen = 1;

        try (BufferedWriter writer = Files.newBufferedWriter(Path.of(outputFilePath), StandardCharsets.UTF_8)) {
            writer.write("[");
            boolean[] firstMove = new boolean[]{true};

            for (int x = 1; x <= 10; x++) {
                for (int y = 1; y <= 10; y++) {
                    if (gameState.getValue(x, y) == playerColor) {
                        int[][] queenMoves = getLegalMovesForQueen(gameState, x, y, queen);
                        getLegalArrowShots(gameState, queenMoves, x, y, queen, writer, firstMove);
                        queen++;
                    }
                }
            }

            writer.write("]");
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write legal moves JSON to " + outputFilePath, e);
        }
    }

    public int[][] getLegalMovesForQueen(Board gameBoard, int startX, int startY, int queenNumber) {
        return getDirectionMove(gameBoard, startX, startY, queenNumber);
    }

    public void getLegalArrowShots(Board gameBoard, int[][] queenMoves, int startX, int startY, int queenNumber,
            BufferedWriter writer, boolean[] firstMove) throws IOException {

        for (int[] move : queenMoves) {
            Board tempBoard = new Board(gameBoard);
            int queenX = move[0];
            int queenY = move[1];
            tempBoard.moveQueen(startX, startY, queenX, queenY);

            int[][] arrowMoves = getDirectionMove(tempBoard, queenX, queenY, 0);
            for (int[] arrowMove : arrowMoves) {
                writeMoveAsJson(writer, firstMove, startX, startY, queenX, queenY,
                        arrowMove[0], arrowMove[1], queenNumber);
            }
        }
    }

    private void writeMoveAsJson(BufferedWriter writer, boolean[] firstMove,
            int startX, int startY, int endX, int endY,
            int arrowX, int arrowY, int queenNumber) throws IOException {
        if (!firstMove[0]) writer.write(",");
        firstMove[0] = false;

        writer.write("{\"startX\":");  writer.write(Integer.toString(startX));
        writer.write(",\"startY\":"); writer.write(Integer.toString(startY));
        writer.write(",\"endX\":");   writer.write(Integer.toString(endX));
        writer.write(",\"endY\":");   writer.write(Integer.toString(endY));
        writer.write(",\"arrowX\":"); writer.write(Integer.toString(arrowX));
        writer.write(",\"arrowY\":"); writer.write(Integer.toString(arrowY));
        writer.write(",\"queen\":");  writer.write(Integer.toString(queenNumber));
        writer.write("}");
    }

    public int[][] getDirectionMove(Board gameBoard, int startX, int startY, int itemNum) {
        // Direction vectors: up, up-right, right, down-right, down, down-left, left, up-left
        int[][] dirs = {{-1, 0}, {-1, 1}, {0, 1}, {1, 1}, {1, 0}, {1, -1}, {0, -1}, {-1, -1}};
        ArrayList<int[]> moves = new ArrayList<>();

        for (int[] dir : dirs) {
            int x = startX + dir[0];
            int y = startY + dir[1];
            while (x >= 1 && x <= 10 && y >= 1 && y <= 10 && !gameBoard.isOccupied(x, y)) {
                moves.add(new int[]{x, y, itemNum});
                x += dir[0];
                y += dir[1];
            }
        }

        return moves.toArray(new int[moves.size()][]);
    }
}
