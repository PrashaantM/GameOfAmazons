package ubc.cosc322;

public class Move {

    public int startX;
    public int startY;

    public int endX;
    public int endY;

    public int arrowX;
    public int arrowY;

    public Move(int startX, int startY, int endX, int endY, int arrowX, int arrowY) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.arrowX = arrowX;
        this.arrowY = arrowY;
    }
}