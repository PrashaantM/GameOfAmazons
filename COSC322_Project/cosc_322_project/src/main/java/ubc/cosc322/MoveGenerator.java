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
        ArrayList<Integer> queenTo = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.QUEEN_POS_NEXT);
        ArrayList<Integer> arrowTo = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.ARROW_POS);
        ArrayList<Integer> gameState = (ArrayList<Integer>) msgDetails.get(AmazonsGameMessage.GAME_STATE);

        int startX = queenFrom.get(0);
        int startY = queenFrom.get(1);
        int endX = queenTo.get(0);
        int endY = queenTo.get(1);
        int arrowX = arrowTo.get(0);
        int arrowY = arrowTo.get(1);

        Board gameBoard = new Board(gameState);
        boolean legalMove = queenLegalMove(startX, startY, endX, endY, gameBoard);

        if (!legalMove) {
            return false;
        }

        return shootingLegalMove(endX, endY, arrowX, arrowY, gameBoard);
    }

    public boolean queenLegalMove(int startXPos, int startYPos, int endXPos, int endYPos, Board gameState) {

        boolean legalMove = checkMoveInLine(startXPos, startYPos, endXPos, endYPos);

        if (legalMove) {
            legalMove = checkPathClear(startXPos, startYPos, endXPos, endYPos, gameState);
        }

        return legalMove;
    }

    public boolean checkMoveInLine(int StartXPos, int StartYPos, int EndXPos, int EndYPos) {

        if(StartXPos == EndXPos || StartYPos == EndYPos){
            return true;
        }

        else if(Math.abs(StartXPos - EndXPos) == Math.abs(StartYPos - EndYPos)){
            return true;
        }

        return false;
    }

    public boolean checkPathClear(int StartXPos, int StartYPos, int EndXPos, int EndYPos, Board currentGameState) {

        int moveDistance = Math.max(Math.abs(StartXPos - EndXPos), Math.abs(StartYPos - EndYPos));

        int[][] moveLine = new int [moveDistance + 1][2];

        if(StartXPos == EndXPos) {

            for(int i = 0; i <= moveDistance; i++) {

                moveLine[i][0] = StartXPos;

                if(StartYPos < EndYPos) {
                    moveLine[i][1] = StartYPos + i;
                } else {
                    moveLine[i][1] = StartYPos - i;
                }
            }
        }

        else if (StartYPos == EndYPos) {

            for(int i = 0; i <= moveDistance; i++) {

                if(StartXPos < EndXPos) {
                    moveLine[i][0] = StartXPos + i;
                } else {
                    moveLine[i][0] = StartXPos - i;
                }

                moveLine[i][1] = StartYPos;
            }
        }

        else {

            for(int i = 0; i <= moveDistance; i++) {

                if(StartXPos<EndXPos && StartYPos<EndYPos) {
                    moveLine[i][0] = StartXPos + i;
                    moveLine[i][1] = StartYPos + i;
                }

                else if (StartXPos<EndXPos && StartYPos>EndYPos) {
                    moveLine[i][0] = StartXPos + i;
                    moveLine[i][1] = StartYPos - i;
                }

                else if (StartXPos>EndXPos && StartYPos<EndYPos) {
                    moveLine[i][0] = StartXPos - i;
                    moveLine[i][1] = StartYPos + i;
                }

                else {
                    moveLine[i][0] = StartXPos - i;
                    moveLine[i][1] = StartYPos - i;
                }
            }
        }

        return comparePoints(moveLine, currentGameState);
    }

    public boolean comparePoints(int[][] moveLine, Board gameState) {
        for (int i = 1; i < moveLine.length; i++) {
            int x = moveLine[i][0];
            int y = moveLine[i][1];
            if (gameState.isOccupied(x, y)) {
                return false;
            }
            
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

    public int [][] getLegalMovesForQueen(Board gameBoard, int startX, int startY, int queenNumber) {
        return getDirectionMove(gameBoard, startX, startY, queenNumber);  
    }

    public void getLegalArrowShots(Board gameBoard, int[][] queenMoves, int startX, int startY, int queenNumber,
            BufferedWriter writer, boolean[] firstMove) throws IOException {

        for(int[] move : queenMoves) {

            Board tempBoard = new Board(gameBoard);
            
            int queenX = move[0];   
            int queenY = move[1];
            tempBoard.moveQueen(startX, startY, queenX, queenY);

            int[][] arrowMoves = getDirectionMove(tempBoard, queenX, queenY, 0);
            for(int[] arrowMove : arrowMoves) {
                int arrowX = arrowMove[0];
                int arrowY = arrowMove[1];
                writeMoveAsJson(writer, firstMove, startX, startY, queenX, queenY, arrowX, arrowY, queenNumber);
            }
        }
    }

    private void writeMoveAsJson(BufferedWriter writer, boolean[] firstMove, int startX, int startY, int endX, int endY,
            int arrowX, int arrowY, int queenNumber) throws IOException {
        if (!firstMove[0]) {
            writer.write(",");
        }
        firstMove[0] = false;

        writer.write("{\"startX\":");
        writer.write(Integer.toString(startX));
        writer.write(",\"startY\":");
        writer.write(Integer.toString(startY));
        writer.write(",\"endX\":");
        writer.write(Integer.toString(endX));
        writer.write(",\"endY\":");
        writer.write(Integer.toString(endY));
        writer.write(",\"arrowX\":");
        writer.write(Integer.toString(arrowX));
        writer.write(",\"arrowY\":");
        writer.write(Integer.toString(arrowY));
        writer.write(",\"queen\":");
        writer.write(Integer.toString(queenNumber));
        writer.write("}");
    }

    public int [][] getDirectionMove(Board gameBoard, int startX, int startY, int itemNum){

        ArrayList<int[]> Moves = new ArrayList<>();

        for (int i=0; i<8; i++) {
            
            boolean canContinue = true;

            int distanceMoved=0;
            int endX = startX;
            int endY = startY;

            while (canContinue==true){

                distanceMoved++;

                if (i==0){
                    endX = startX - distanceMoved;
                    endY = startY;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }
                }

                if (i==1){
                    endX = startX - distanceMoved;
                    endY = startY + distanceMoved;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }
                }

                if (i==2){      
                    
                    endX = startX;
                    endY = startY + distanceMoved;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }
                }

                if (i==3){
                    endX = startX + distanceMoved;
                    endY = startY + distanceMoved;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }

                }

                if (i==4){
                    endX = startX + distanceMoved;
                    endY = startY;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }
                }

                if (i==5){
                    endX = startX + distanceMoved;
                    endY = startY - distanceMoved;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }
                }

                if (i==6){
                    endX = startX;
                    endY = startY - distanceMoved;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }
                }

                if(i==7){
                    endX = startX - distanceMoved;
                    endY = startY - distanceMoved;
                    if (endX < 1 || endX > 10 || endY < 1 || endY > 10 || gameBoard.isOccupied(endX, endY)) {
                        canContinue = false;
                    } else {
                        Moves.add(new int[]{endX, endY, itemNum});
                    }
                }

            }

        }
        return Moves.toArray(new int[Moves.size()][]);
    }
}
